package edu.cit.beato.eventuniverse.feature.home

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import edu.cit.beato.eventuniverse.R
import edu.cit.beato.eventuniverse.api.EventData
import java.text.SimpleDateFormat
import java.util.*

class EventAdapter(
    private var events: List<EventData>,
    private val onActionClick: (EventData) -> Unit
) : RecyclerView.Adapter<EventAdapter.EventViewHolder>() {

    // "Register", "Registered", or "View Details" — set from outside
    private var actionLabels: Map<String, String> = emptyMap()

    fun setActionLabels(labels: Map<String, String>) {
        actionLabels = labels
        notifyDataSetChanged()
    }

    fun updateEvents(newEvents: List<EventData>) {
        events = newEvents
        notifyDataSetChanged()
    }

    inner class EventViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val ivPicture: ImageView = itemView.findViewById(R.id.ivEventPicture)
        val tvTitle: TextView = itemView.findViewById(R.id.tvEventTitle)
        val tvStatus: TextView = itemView.findViewById(R.id.tvStatus)
        val tvOrganizer: TextView = itemView.findViewById(R.id.tvOrganizer)
        val tvDetails: TextView = itemView.findViewById(R.id.tvDetails)
        val tvLocationDate: TextView = itemView.findViewById(R.id.tvLocationDate)
        val tvAction: TextView = itemView.findViewById(R.id.tvActionButton)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): EventViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_event_card, parent, false)
        return EventViewHolder(view)
    }

    override fun onBindViewHolder(holder: EventViewHolder, position: Int) {
        val event = events[position]

        // Picture
        if (!event.picture.isNullOrEmpty()) {
            Glide.with(holder.itemView.context)
                .load(event.picture)
                .placeholder(R.drawable.defaultevent)
                .error(R.drawable.defaultevent)
                .into(holder.ivPicture)
        } else {
            holder.ivPicture.setImageResource(R.drawable.defaultevent)
        }

        // Title
        holder.tvTitle.text = event.eventName

        // Status badge
        val now = System.currentTimeMillis()
        val eventTime = parseDateTime(event.eventDateTime)
        val isOngoing = eventTime == null || eventTime > now
        if (isOngoing) {
            holder.tvStatus.text = "ONGOING"
            holder.tvStatus.setBackgroundResource(R.drawable.status_badge_background)
        } else {
            holder.tvStatus.text = "CLOSED"
            holder.tvStatus.setBackgroundResource(R.drawable.red_button_background)
        }

        // Organizer
        holder.tvOrganizer.text = "by ${event.organizerName ?: "Organizer"}"

        // Price + Dept + Payment
        val price = getPriceDisplay(event)
        val dept = getDeptDisplay(event.departments)
        val payment = getPaymentDisplay(event)
        holder.tvDetails.text = buildString {
            append(price)
            append(" • ")
            append(dept)
            if (payment != null) append(" • $payment")
        }

        // Location + Date
        holder.tvLocationDate.text = "${event.venue}  ${formatDateTime(event.eventDateTime)}"

        // Action button
        val label = actionLabels[event.id] ?: "Register"
        holder.tvAction.text = label
        holder.tvAction.setOnClickListener { onActionClick(event) }
    }

    override fun getItemCount() = events.size

    private fun parseDateTime(dateTimeStr: String?): Long? {
        if (dateTimeStr.isNullOrEmpty()) return null
        return try {
            val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
            sdf.parse(dateTimeStr)?.time
        } catch (e: Exception) { null }
    }

    private fun formatDateTime(dateTimeStr: String?): String {
        if (dateTimeStr.isNullOrEmpty()) return ""
        return try {
            val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
            val date = sdf.parse(dateTimeStr) ?: return ""
            val out = SimpleDateFormat("MMM dd, yyyy hh:mm a", Locale.getDefault())
            out.format(date)
        } catch (e: Exception) { "" }
    }

    private fun getPriceDisplay(event: EventData): String {
        if (!event.categoriesEnabled) return "Free"
        return try {
            val cats = org.json.JSONArray(event.categories ?: "[]")
            when {
                cats.length() == 0 -> "Free"
                cats.length() == 1 -> "P ${cats.getJSONObject(0).getString("price")}"
                else -> "Varies"
            }
        } catch (e: Exception) { "Free" }
    }

    private fun getDeptDisplay(departments: String?): String {
        if (departments.isNullOrEmpty()) return "Open for All"
        val depts = departments.split("|").map { it.trim() }
        if (depts.size == 6) return "Open for All"
        val acronyms = mapOf(
            "College of Engineering and Architecture" to "CEA",
            "College of Management, Business and Accountancy" to "CMBA",
            "College of Arts, Sciences and Education" to "CASE",
            "College of Nursing and Allied Health Sciences" to "CNAHS",
            "College of Computer Studies" to "CCS",
            "College of Criminal Justice" to "CCJ"
        )
        return depts.map { acronyms[it] ?: it }.joinToString(", ")
    }

    private fun getPaymentDisplay(event: EventData): String? {
        val methods = mutableListOf<String>()
        if (event.gcashEnabled) methods.add("Online")
        if (event.onsiteEnabled) methods.add("Onsite")
        return if (methods.isEmpty()) null else methods.joinToString("/")
    }
}