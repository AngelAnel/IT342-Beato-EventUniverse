package edu.cit.beato.eventuniverse.feature.profile

import android.os.Bundle
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.AppCompatButton
import edu.cit.beato.eventuniverse.R
import edu.cit.beato.eventuniverse.api.RetrofitClient
import kotlinx.coroutines.*

class ProfileActivity : AppCompatActivity() {

    private lateinit var tvFirstName: TextView
    private lateinit var tvLastName: TextView
    private lateinit var etFirstName: EditText
    private lateinit var etLastName: EditText
    private lateinit var etEmail: EditText
    private lateinit var spinnerDept: Spinner
    private lateinit var btnEditSave: AppCompatButton
    private lateinit var btnChangePassword: AppCompatButton
    private lateinit var tvError: TextView
    private lateinit var tvSuccess: TextView

    private var token = ""
    private var isEditing = false

    private val departments = listOf(
        "College of Engineering and Architecture",
        "College of Management, Business and Accountancy",
        "College of Arts, Sciences and Education",
        "College of Nursing and Allied Health Sciences",
        "College of Computer Studies",
        "College of Criminal Justice"
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_profile)
        supportActionBar?.hide()

        token = intent.getStringExtra("token") ?: ""

        bindViews()
        setupSpinner()
        setupBackButton()
        loadProfile()

        btnEditSave.setOnClickListener {
            if (isEditing) saveProfile() else enableEditing()
        }

        btnChangePassword.setOnClickListener {
            showChangePasswordDialog()
        }
    }

    private fun bindViews() {
        tvFirstName = findViewById(R.id.tvFirstName)
        tvLastName = findViewById(R.id.tvLastName)
        etFirstName = findViewById(R.id.etFirstName)
        etLastName = findViewById(R.id.etLastName)
        etEmail = findViewById(R.id.etEmail)
        spinnerDept = findViewById(R.id.spinnerDept)
        btnEditSave = findViewById(R.id.btnEditSave)
        btnChangePassword = findViewById(R.id.btnChangePassword)
        tvError = findViewById(R.id.tvError)
        tvSuccess = findViewById(R.id.tvSuccess)
    }

    private fun setupSpinner() {
        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, departments)
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinnerDept.adapter = adapter
        spinnerDept.isEnabled = false
    }

    private fun setupBackButton() {
        findViewById<View>(R.id.btnBack).setOnClickListener { finish() }
    }

    private fun loadProfile() {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val res = RetrofitClient.instance.getMe("Bearer $token")
                withContext(Dispatchers.Main) {
                    if (res.isSuccessful && res.body()?.success == true) {
                        val user = res.body()?.data?.user
                        etFirstName.setText(user?.firstName ?: "")
                        etLastName.setText(user?.lastName ?: "")
                        etEmail.setText(user?.email ?: "")
                        tvFirstName.text = user?.firstName ?: ""
                        tvLastName.text = user?.lastName ?: ""

                        val deptIndex = departments.indexOf(user?.department ?: "")
                        if (deptIndex >= 0) spinnerDept.setSelection(deptIndex)

                        // Disable fields by default
                        setFieldsEnabled(false)
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    showError("Failed to load profile")
                }
            }
        }
    }

    private fun enableEditing() {
        isEditing = true
        setFieldsEnabled(true)
        btnEditSave.text = "Save"
        tvError.visibility = View.GONE
        tvSuccess.visibility = View.GONE
    }

    private fun setFieldsEnabled(enabled: Boolean) {
        etFirstName.isEnabled = enabled
        etLastName.isEnabled = enabled
        spinnerDept.isEnabled = enabled
        etEmail.isEnabled = false // always disabled
    }

    private fun saveProfile() {
        val firstName = etFirstName.text.toString().trim()
        val lastName = etLastName.text.toString().trim()
        val department = spinnerDept.selectedItem.toString()

        if (firstName.isEmpty() || lastName.isEmpty()) {
            showError("Fields cannot be empty")
            return
        }

        btnEditSave.isEnabled = false
        btnEditSave.text = "Saving..."

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val res = RetrofitClient.instance.updateProfile(
                    "Bearer $token",
                    mapOf("firstName" to firstName, "lastName" to lastName, "department" to department)
                )
                withContext(Dispatchers.Main) {
                    if (res.isSuccessful && res.body()?.success == true) {
                        isEditing = false
                        setFieldsEnabled(false)
                        btnEditSave.text = "Edit"
                        tvFirstName.text = firstName
                        tvLastName.text = lastName
                        showSuccess("Profile updated successfully!")
                    } else {
                        showError(res.body()?.message ?: "Update failed")
                    }
                    btnEditSave.isEnabled = true
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    showError("Connection failed")
                    btnEditSave.isEnabled = true
                    btnEditSave.text = "Save"
                }
            }
        }
    }

    private fun showChangePasswordDialog() {
        val dialogView = layoutInflater.inflate(R.layout.dialog_change_password, null)
        val etOld = dialogView.findViewById<EditText>(R.id.etOldPassword)
        val etNew = dialogView.findViewById<EditText>(R.id.etNewPassword)
        val etConfirm = dialogView.findViewById<EditText>(R.id.etConfirmPassword)
        val tvDialogError = dialogView.findViewById<TextView>(R.id.tvDialogError)

        android.app.AlertDialog.Builder(this)
            .setTitle("Change Password")
            .setView(dialogView)
            .setPositiveButton("Change") { dialog, _ ->
                val old = etOld.text.toString().trim()
                val new = etNew.text.toString().trim()
                val confirm = etConfirm.text.toString().trim()

                if (old.isEmpty() || new.isEmpty() || confirm.isEmpty()) {
                    tvDialogError.text = "All fields are required"
                    tvDialogError.visibility = View.VISIBLE
                    return@setPositiveButton
                }
                if (new != confirm) {
                    tvDialogError.text = "Passwords do not match"
                    tvDialogError.visibility = View.VISIBLE
                    return@setPositiveButton
                }
                if (new.length < 8) {
                    tvDialogError.text = "Password must be at least 8 characters"
                    tvDialogError.visibility = View.VISIBLE
                    return@setPositiveButton
                }

                changePassword(old, new, confirm)
                dialog.dismiss()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun changePassword(old: String, new: String, confirm: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val res = RetrofitClient.instance.changePassword(
                    "Bearer $token",
                    mapOf("oldPassword" to old, "newPassword" to new, "confirmPassword" to confirm)
                )
                withContext(Dispatchers.Main) {
                    if (res.isSuccessful && res.body()?.success == true) {
                        showSuccess("Password changed successfully!")
                    } else {
                        showError(res.body()?.message ?: "Failed to change password")
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    showError("Connection failed")
                }
            }
        }
    }

    private fun showError(message: String) {
        tvError.text = message
        tvError.visibility = View.VISIBLE
        tvSuccess.visibility = View.GONE
    }

    private fun showSuccess(message: String) {
        tvSuccess.text = message
        tvSuccess.visibility = View.VISIBLE
        tvError.visibility = View.GONE
    }
}