package edu.cit.beato.eventuniverse.feature.home

import android.app.Dialog
import android.content.res.ColorStateList
import android.graphics.BitmapFactory
import android.os.Bundle
import android.util.Base64
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import edu.cit.beato.eventuniverse.R
import edu.cit.beato.eventuniverse.api.EventData
import edu.cit.beato.eventuniverse.api.RegistrationRequest
import edu.cit.beato.eventuniverse.api.RetrofitClient
import edu.cit.beato.eventuniverse.api.SlotCountData
import kotlinx.coroutines.*
import org.json.JSONArray
import java.io.ByteArrayOutputStream

class RegisterBottomSheet : BottomSheetDialogFragment() {

    private lateinit var event: EventData
    private lateinit var token: String
    private var slotData: SlotCountData? = null
    private var selectedCategory: Triple<String, String, Int?>? = null // name, price, slots
    private var selectedPaymentMethod: String? = null
    private var proofBase64: String? = null
    private var onSuccess: (() -> Unit)? = null

    companion object {
        fun newInstance(event: EventData, token: String, onSuccess: () -> Unit): RegisterBottomSheet {
            return RegisterBottomSheet().apply {
                this.event = event
                this.token = token
                this.onSuccess = onSuccess
            }
        }
    }

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        val dialog = super.onCreateDialog(savedInstanceState) as BottomSheetDialog
        dialog.setOnShowListener {
            val bottomSheet = dialog.findViewById<View>(
                com.google.android.material.R.id.design_bottom_sheet
            )
            bottomSheet?.let {
                val behavior = BottomSheetBehavior.from(it)
                behavior.state = BottomSheetBehavior.STATE_EXPANDED
                behavior.skipCollapsed = true
            }
        }
        return dialog
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?
    ): View = inflater.inflate(R.layout.bottom_sheet_register, container, false)

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val categories = parseCategories()
        val hasCategories = event.categoriesEnabled && categories.isNotEmpty()
        val hasPayment = event.gcashEnabled || event.onsiteEnabled
        val hasAttachment = event.attachmentEnabled

        // Header
        view.findViewById<TextView>(R.id.tvEventName).text = event.eventName
        view.findViewById<TextView>(R.id.tvOrganizerName).text = "by ${event.organizerName}"

        // Close button
        view.findViewById<View>(R.id.btnClose).setOnClickListener { dismiss() }

        // Load slot counts first
        loadSlotCounts(view, hasCategories, hasPayment, hasAttachment, categories)
    }

    private fun loadSlotCounts(
        view: View,
        hasCategories: Boolean,
        hasPayment: Boolean,
        hasAttachment: Boolean,
        categories: List<Triple<String, String, Int?>>
    ) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val res = RetrofitClient.instance.getSlotCounts("Bearer $token", event.id)
                if (res.isSuccessful) {
                    slotData = res.body()?.data
                }
            } catch (e: Exception) { /* ignore */ }

            withContext(Dispatchers.Main) {
                if (!isAdded) return@withContext

                val data = slotData
                val alreadyRegistered = data?.alreadyRegistered == true

                if (alreadyRegistered) {
                    showAlreadyRegistered(view)
                    return@withContext
                }

                // Check slots full
                val counts = data?.counts ?: emptyMap()
                val isFull = checkSlotsFull(counts, hasCategories, categories)
                if (isFull) {
                    showSlotsFull(view)
                    return@withContext
                }

                buildUI(view, hasCategories, hasPayment, hasAttachment, categories, counts)
            }
        }
    }

    private fun buildUI(
        view: View,
        hasCategories: Boolean,
        hasPayment: Boolean,
        hasAttachment: Boolean,
        categories: List<Triple<String, String, Int?>>,
        counts: Map<String, Int>
    ) {
        val container = view.findViewById<LinearLayout>(R.id.llContent)
        container.visibility = View.VISIBLE
        view.findViewById<View>(R.id.tvLoading).visibility = View.GONE

        // Free event banner
        if (!hasPayment && !hasCategories) {
            view.findViewById<View>(R.id.layoutFreeBanner).visibility = View.VISIBLE
        }

        // Categories
        if (hasCategories) {
            val catContainer = view.findViewById<LinearLayout>(R.id.llCategories)
            catContainer.visibility = View.VISIBLE
            view.findViewById<TextView>(R.id.tvDetailsTitle).visibility = View.VISIBLE

            categories.forEach { cat ->
                val taken = counts[cat.first] ?: 0
                val totalSlots = cat.third
                val row = layoutInflater.inflate(R.layout.item_category_row, catContainer, false)
                row.findViewById<TextView>(R.id.tvCatName).text = cat.first
                row.findViewById<TextView>(R.id.tvCatSlots).text =
                    "$taken/${totalSlots ?: "∞"}"
                row.findViewById<TextView>(R.id.tvCatPrice).text = "P ${cat.second}"
                row.setOnClickListener {
                    selectedCategory = cat
                    highlightSelectedCategory(catContainer, row)
                }
                catContainer.addView(row)
            }

            // Summary section
            view.findViewById<View>(R.id.layoutSummary).visibility = View.VISIBLE
        } else {
            // Slots display for non-category events
            view.findViewById<TextView>(R.id.tvDetailsTitle).visibility = View.VISIBLE
            val slotsBox = view.findViewById<TextView>(R.id.tvSlotsDisplay)
            slotsBox.visibility = View.VISIBLE
            val total = counts.values.sum()
            slotsBox.text = if (event.maxParticipantsEnabled && event.maxParticipants != null)
                "Slots Available: $total / ${event.maxParticipants}"
            else "Slots Available: Open"
        }

        // Attachment / Links
        if (hasAttachment) {
            view.findViewById<View>(R.id.layoutLinks).visibility = View.VISIBLE
            if (!event.attachmentInstructions.isNullOrBlank()) {
                view.findViewById<TextView>(R.id.tvAttachmentInstructions).apply {
                    text = event.attachmentInstructions
                    visibility = View.VISIBLE
                }
            }
        }

        // Payment methods
        if (hasPayment) {
            view.findViewById<View>(R.id.layoutPayment).visibility = View.VISIBLE
            view.findViewById<TextView>(R.id.tvPaymentTitle).visibility = View.VISIBLE

            // GCash
            if (event.gcashEnabled) {
                val gcashSection = view.findViewById<LinearLayout>(R.id.layoutGcash)
                gcashSection.visibility = View.VISIBLE
                view.findViewById<View>(R.id.btnGcash).setOnClickListener {
                    selectedPaymentMethod = "Online"
                    showGcashQR()
                }
                view.findViewById<View>(R.id.btnProofGcash).setOnClickListener {
                    selectedPaymentMethod = "Online"
                    pickProofImage(view, "gcash")
                }
            }

            // Onsite
            if (event.onsiteEnabled) {
                val onsiteSection = view.findViewById<LinearLayout>(R.id.layoutOnsite)
                onsiteSection.visibility = View.VISIBLE
                if (!event.onsiteLocation.isNullOrBlank())
                    view.findViewById<TextView>(R.id.tvOnsiteLocation).text = "Location: ${event.onsiteLocation}"
                if (!event.onsiteStart.isNullOrBlank())
                    view.findViewById<TextView>(R.id.tvOnsiteStart).text = "Start: ${event.onsiteStart}"
                if (!event.onsiteEnd.isNullOrBlank())
                    view.findViewById<TextView>(R.id.tvOnsiteEnd).text = "End: ${event.onsiteEnd}"
                if (!event.onsitePersonnel.isNullOrBlank())
                    view.findViewById<TextView>(R.id.tvOnsitePersonnel).text = "Personnel: ${event.onsitePersonnel}"
                view.findViewById<View>(R.id.btnProofOnsite).setOnClickListener {
                    selectedPaymentMethod = "Onsite"
                    pickProofImage(view, "onsite")
                }
            }
        }

        // Confirm button
        view.findViewById<View>(R.id.btnConfirm).setOnClickListener {
            handleConfirm(view, hasCategories, hasPayment, hasAttachment)
        }
    }

    private fun handleConfirm(
        view: View,
        hasCategories: Boolean,
        hasPayment: Boolean,
        hasAttachment: Boolean
    ) {
        val linkInput = view.findViewById<EditText>(R.id.etLink)
        val linkText = linkInput?.text?.toString()?.trim() ?: ""
        val tvWarning = view.findViewById<TextView>(R.id.tvWarning)

        // Validations
        if (hasCategories && selectedCategory == null) {
            tvWarning.text = "Please select a category"
            tvWarning.visibility = View.VISIBLE
            return
        }
        if (hasPayment && proofBase64 == null) {
            tvWarning.text = "Please upload proof of payment"
            tvWarning.visibility = View.VISIBLE
            return
        }
        if (hasAttachment && linkText.isEmpty()) {
            tvWarning.text = "Please add at least one link"
            tvWarning.visibility = View.VISIBLE
            return
        }

        tvWarning.visibility = View.GONE
        val btnConfirm = view.findViewById<Button>(R.id.btnConfirm)
        btnConfirm.isEnabled = false
        btnConfirm.text = "SUBMITTING..."

        val request = RegistrationRequest(
            eventId = event.id,
            categoryName = selectedCategory?.first ?: "General",
            categoryPrice = selectedCategory?.second ?: "0",
            paymentMethod = selectedPaymentMethod ?: "Not specified",
            proofOfPayment = proofBase64,
            links = if (linkText.isNotEmpty()) linkText else null
        )

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val res = RetrofitClient.instance.registerForEvent("Bearer $token", request)
                withContext(Dispatchers.Main) {
                    if (!isAdded) return@withContext
                    if (res.isSuccessful && res.body()?.success == true) {
                        showSuccess(view)
                        CoroutineScope(Dispatchers.Main).launch {
                            delay(2000)
                            onSuccess?.invoke()
                            dismiss()
                        }
                    } else {
                        tvWarning.text = res.body()?.message ?: "Registration failed"
                        tvWarning.visibility = View.VISIBLE
                        btnConfirm.isEnabled = true
                        btnConfirm.text = "CONFIRM REGISTRATION"
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    tvWarning.text = "Connection failed"
                    tvWarning.visibility = View.VISIBLE
                    btnConfirm.isEnabled = true
                    btnConfirm.text = "CONFIRM REGISTRATION"
                }
            }
        }
    }

    private val pickImageLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let {
            val inputStream = requireContext().contentResolver.openInputStream(it)
            val bytes = inputStream?.readBytes()
            inputStream?.close()
            if (bytes != null) {
                proofBase64 = "data:image/jpeg;base64," + Base64.encodeToString(bytes, Base64.NO_WRAP)
                view?.let { v ->
                    // Turn both proof buttons green
                    v.findViewById<Button>(R.id.btnProofGcash)?.apply {
                        text = "✓ Proof Uploaded"
                        backgroundTintList = ColorStateList.valueOf(
                            ContextCompat.getColor(requireContext(), android.R.color.holo_green_dark)
                        )
                    }
                    v.findViewById<Button>(R.id.btnProofOnsite)?.apply {
                        text = "✓ Proof Uploaded"
                        backgroundTintList = ColorStateList.valueOf(
                            ContextCompat.getColor(requireContext(), android.R.color.holo_green_dark)
                        )
                    }
                }
            }
        }
    }

    private fun pickProofImage(view: View, type: String) {
        pickImageLauncher.launch("image/*")
    }

    private fun showGcashQR() {
        val qrs = try { JSONArray(event.gcashQrs ?: "[]") } catch (e: Exception) { JSONArray() }
        if (qrs.length() == 0) {
            Toast.makeText(requireContext(), "No QR code available", Toast.LENGTH_SHORT).show()
            return
        }
        val qrBase64 = qrs.getString(0)
        val dialog = android.app.AlertDialog.Builder(requireContext())
        val imageView = ImageView(requireContext()).apply {
            layoutParams = ViewGroup.LayoutParams(800, 800)
            scaleType = ImageView.ScaleType.FIT_CENTER
            setPadding(24, 24, 24, 24)
        }
        try {
            val clean = qrBase64.substringAfter("base64,")
            val bytes = Base64.decode(clean, Base64.DEFAULT)
            val bmp = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
            imageView.setImageBitmap(bmp)
        } catch (e: Exception) {
            Toast.makeText(requireContext(), "Could not load QR", Toast.LENGTH_SHORT).show()
            return
        }
        dialog.setTitle("GCash QR Code")
            .setView(imageView)
            .setPositiveButton("Done", null)
            .show()
    }

    private fun showAlreadyRegistered(view: View) {
        view.findViewById<View>(R.id.tvLoading).visibility = View.GONE
        view.findViewById<TextView>(R.id.tvStatusMessage).apply {
            text = "You have already registered for this event."
            visibility = View.VISIBLE
        }
    }

    private fun showSlotsFull(view: View) {
        view.findViewById<View>(R.id.tvLoading).visibility = View.GONE
        view.findViewById<TextView>(R.id.tvStatusMessage).apply {
            text = "Sorry, this event is already full."
            setTextColor(ContextCompat.getColor(requireContext(), android.R.color.holo_red_light))
            visibility = View.VISIBLE
        }
    }

    private fun showSuccess(view: View) {
        view.findViewById<LinearLayout>(R.id.llContent).visibility = View.GONE
        view.findViewById<TextView>(R.id.tvSuccessMessage).visibility = View.VISIBLE
    }

    private fun highlightSelectedCategory(container: LinearLayout, selected: View) {
        for (i in 0 until container.childCount) {
            container.getChildAt(i).setBackgroundResource(R.drawable.category_row_normal)
        }
        selected.setBackgroundResource(R.drawable.category_row_selected)
    }

    private fun checkSlotsFull(
        counts: Map<String, Int>,
        hasCategories: Boolean,
        categories: List<Triple<String, String, Int?>>
    ): Boolean {
        if (event.maxParticipantsEnabled && event.maxParticipants != null) {
            val total = counts.values.sum()
            if (total >= (event.maxParticipants ?: return false)) return true
        }
        if (hasCategories) {
            val allFull = categories.all { cat ->
                val slots = cat.third ?: return@all false
                (counts[cat.first] ?: 0) >= slots
            }
            if (allFull) return true
        }
        return false
    }

    private fun parseCategories(): List<Triple<String, String, Int?>> {
        return try {
            val arr = JSONArray(event.categories ?: "[]")
            (0 until arr.length()).map { i ->
                val obj = arr.getJSONObject(i)
                Triple(
                    obj.getString("name"),
                    obj.getString("price"),
                    if (obj.has("slots") && !obj.isNull("slots"))
                        obj.getInt("slots") else null
                )
            }
        } catch (e: Exception) { emptyList() }
    }
}