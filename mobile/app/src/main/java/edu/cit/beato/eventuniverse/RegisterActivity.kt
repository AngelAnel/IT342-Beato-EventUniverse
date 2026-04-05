package edu.cit.beato.eventuniverse

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import edu.cit.beato.eventuniverse.api.RegisterRequest
import edu.cit.beato.eventuniverse.api.RetrofitClient
import kotlinx.coroutines.launch

class RegisterActivity : AppCompatActivity() {

    private var isParticipant = true

    private lateinit var llLogoHeader: LinearLayout
    private lateinit var btnTabParticipant: androidx.appcompat.widget.AppCompatButton
    private lateinit var btnTabOrganizer: androidx.appcompat.widget.AppCompatButton
    private lateinit var layoutParticipant: LinearLayout
    private lateinit var layoutOrganizer: LinearLayout
    private lateinit var tvFormTitle: TextView
    private lateinit var tvError: TextView
    private lateinit var btnRegister: androidx.appcompat.widget.AppCompatButton

    // Participant fields
    private lateinit var etFirstName: EditText
    private lateinit var etLastName: EditText
    private lateinit var etEmailParticipant: EditText
    private lateinit var etPasswordParticipant: EditText
    private lateinit var etConfirmPasswordParticipant: EditText
    private lateinit var spinnerDeptParticipant: Spinner

    // Organizer fields
    private lateinit var etOrgName: EditText
    private lateinit var etEmailOrganizer: EditText
    private lateinit var etPasswordOrganizer: EditText
    private lateinit var etConfirmPasswordOrganizer: EditText
    private lateinit var spinnerDeptOrganizer: Spinner

    private val departments = listOf(
        "Choose Department",
        "College of Engineering and Architecture",
        "College of Management, Business and Accountancy",
        "College of Arts, Sciences and Education",
        "College of Nursing and Allied Health Sciences",
        "College of Computer Studies",
        "College of Criminal Justice"
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register)

        bindViews()
        setupSpinners()

        // Logo click → back to Login
        llLogoHeader.setOnClickListener {
            val intent = Intent(this, LoginActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP
            startActivity(intent)
            finish()
        }

        btnTabParticipant.setOnClickListener { animateAndSwitch(true) }
        btnTabOrganizer.setOnClickListener { animateAndSwitch(false) }
        btnRegister.setOnClickListener { handleRegister() }

        // Start with Participant active
        setTabState(true)
    }

    private fun animateAndSwitch(participant: Boolean) {
        // Show pressed state briefly then switch
        val clickedBtn = if (participant) btnTabParticipant else btnTabOrganizer
        clickedBtn.setBackgroundResource(R.drawable.tab_pressed_background)
        Handler(Looper.getMainLooper()).postDelayed({
            setTabState(participant)
        }, 120)
    }

    private fun setTabState(participant: Boolean) {
        isParticipant = participant
        tvError.visibility = View.GONE

        if (participant) {
            layoutParticipant.visibility = View.VISIBLE
            layoutOrganizer.visibility = View.GONE
            tvFormTitle.text = "Register as Participant"
            btnTabParticipant.setBackgroundResource(R.drawable.tab_active_background)
            btnTabOrganizer.setBackgroundResource(R.drawable.tab_inactive_background)
        } else {
            layoutParticipant.visibility = View.GONE
            layoutOrganizer.visibility = View.VISIBLE
            tvFormTitle.text = "Register as Organizer"
            btnTabParticipant.setBackgroundResource(R.drawable.tab_inactive_background)
            btnTabOrganizer.setBackgroundResource(R.drawable.tab_active_background)
        }
    }

    private fun bindViews() {
        llLogoHeader = findViewById(R.id.llLogoHeader)
        btnTabParticipant = findViewById(R.id.btnTabParticipant)
        btnTabOrganizer = findViewById(R.id.btnTabOrganizer)
        layoutParticipant = findViewById(R.id.layoutParticipant)
        layoutOrganizer = findViewById(R.id.layoutOrganizer)
        tvFormTitle = findViewById(R.id.tvFormTitle)
        tvError = findViewById(R.id.tvRegisterError)
        btnRegister = findViewById(R.id.btnRegister)

        etFirstName = findViewById(R.id.etFirstName)
        etLastName = findViewById(R.id.etLastName)
        etEmailParticipant = findViewById(R.id.etEmailParticipant)
        etPasswordParticipant = findViewById(R.id.etPasswordParticipant)
        etConfirmPasswordParticipant = findViewById(R.id.etConfirmPasswordParticipant)
        spinnerDeptParticipant = findViewById(R.id.spinnerDeptParticipant)

        etOrgName = findViewById(R.id.etOrgName)
        etEmailOrganizer = findViewById(R.id.etEmailOrganizer)
        etPasswordOrganizer = findViewById(R.id.etPasswordOrganizer)
        etConfirmPasswordOrganizer = findViewById(R.id.etConfirmPasswordOrganizer)
        spinnerDeptOrganizer = findViewById(R.id.spinnerDeptOrganizer)
    }

    private fun setupSpinners() {
        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, departments)
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinnerDeptParticipant.adapter = adapter
        spinnerDeptOrganizer.adapter = adapter
    }

    private fun handleRegister() {
        tvError.visibility = View.GONE

        val firstName: String
        val lastName: String
        val email: String
        val password: String
        val confirmPassword: String
        val department: String
        val role: String

        if (isParticipant) {
            firstName = etFirstName.text.toString().trim()
            lastName = etLastName.text.toString().trim()
            email = etEmailParticipant.text.toString().trim()
            password = etPasswordParticipant.text.toString().trim()
            confirmPassword = etConfirmPasswordParticipant.text.toString().trim()
            department = spinnerDeptParticipant.selectedItem.toString()
            role = "Participant"
        } else {
            firstName = etOrgName.text.toString().trim()
            lastName = etOrgName.text.toString().trim()
            email = etEmailOrganizer.text.toString().trim()
            password = etPasswordOrganizer.text.toString().trim()
            confirmPassword = etConfirmPasswordOrganizer.text.toString().trim()
            department = spinnerDeptOrganizer.selectedItem.toString()
            role = "Organization"
        }

        // Validation
        if (firstName.isEmpty() || email.isEmpty() || password.isEmpty() || confirmPassword.isEmpty()) {
            showError("All fields are required")
            return
        }
        if (isParticipant && lastName.isEmpty()) {
            showError("Last name is required")
            return
        }
        if (department == "Choose Department") {
            showError("Please choose a department")
            return
        }
        if (password != confirmPassword) {
            showError("Passwords do not match")
            return
        }
        if (password.length < 8) {
            showError("Password must be at least 8 characters")
            return
        }

        btnRegister.isEnabled = false
        btnRegister.text = "registering..."

        val request = RegisterRequest(
            firstName = firstName,
            lastName = lastName,
            email = email,
            password = password,
            confirmPassword = confirmPassword,
            department = department,
            role = role
        )

        lifecycleScope.launch {
            try {
                val response = RetrofitClient.instance.register(request)
                if (response.isSuccessful && response.body()?.success == true) {
                    Toast.makeText(
                        this@RegisterActivity,
                        "Registration successful! Please log in.",
                        Toast.LENGTH_LONG
                    ).show()
                    val intent = Intent(this@RegisterActivity, LoginActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP
                    startActivity(intent)
                    finish()
                } else {
                    showError(response.body()?.message ?: "Registration failed. Please try again.")
                }
            } catch (e: Exception) {
                showError("Connection failed. Make sure backend is running.")
            } finally {
                btnRegister.isEnabled = true
                btnRegister.text = "register"
            }
        }
    }

    private fun showError(message: String) {
        tvError.text = message
        tvError.visibility = View.VISIBLE
    }
}