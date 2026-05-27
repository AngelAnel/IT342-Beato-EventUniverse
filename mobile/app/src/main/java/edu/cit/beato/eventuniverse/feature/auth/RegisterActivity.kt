package edu.cit.beato.eventuniverse.feature.auth

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.AppCompatButton
import androidx.lifecycle.lifecycleScope
import edu.cit.beato.eventuniverse.R
import edu.cit.beato.eventuniverse.api.RegisterRequest
import edu.cit.beato.eventuniverse.api.RetrofitClient
import kotlinx.coroutines.launch

class RegisterActivity : AppCompatActivity() {

    private lateinit var tvTitle: TextView
    private lateinit var tvError: TextView
    private lateinit var btnRegister: AppCompatButton
    private lateinit var tvLoginLink: TextView

    private lateinit var layoutParticipant: View
    private lateinit var etFirstName: EditText
    private lateinit var etLastName: EditText
    private lateinit var etEmailParticipant: EditText
    private lateinit var etPasswordParticipant: EditText
    private lateinit var etConfirmPasswordParticipant: EditText
    private lateinit var spinnerParticipant: Spinner

    private lateinit var layoutOrganizer: View
    private lateinit var etOrgName: EditText
    private lateinit var etEmailOrganizer: EditText
    private lateinit var etPasswordOrganizer: EditText
    private lateinit var etConfirmPasswordOrganizer: EditText
    private lateinit var spinnerOrganizer: Spinner

    private var role: String = "Participant"

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
        supportActionBar?.hide()

        role = intent.getStringExtra("role") ?: "Participant"

        bindViews()
        setupSpinners()

        tvTitle.text = if (role == "Participant") "Register as Participant" else "Register as Organizer"

        layoutParticipant.visibility = if (role == "Participant") View.VISIBLE else View.GONE
        layoutOrganizer.visibility = if (role == "Organization") View.VISIBLE else View.GONE

        findViewById<View>(R.id.btnBack).setOnClickListener {
            startActivity(Intent(this, LandingActivity::class.java))
            finish()
        }

        tvLoginLink.setOnClickListener {
            startActivity(Intent(this, LoginActivity::class.java).apply {
                putExtra("role", role)
            })
            finish()
        }

        btnRegister.setOnClickListener { handleRegister() }
    }

    private fun bindViews() {
        tvTitle = findViewById(R.id.tvTitle)
        tvError = findViewById(R.id.tvError)
        btnRegister = findViewById(R.id.btnRegister)
        tvLoginLink = findViewById(R.id.tvLoginLink)

        layoutParticipant = findViewById(R.id.layoutParticipant)
        etFirstName = findViewById(R.id.etFirstName)
        etLastName = findViewById(R.id.etLastName)
        etEmailParticipant = findViewById(R.id.etEmailParticipant)
        etPasswordParticipant = findViewById(R.id.etPasswordParticipant)
        etConfirmPasswordParticipant = findViewById(R.id.etConfirmPasswordParticipant)
        spinnerParticipant = findViewById(R.id.spinnerParticipant)

        layoutOrganizer = findViewById(R.id.layoutOrganizer)
        etOrgName = findViewById(R.id.etOrgName)
        etEmailOrganizer = findViewById(R.id.etEmailOrganizer)
        etPasswordOrganizer = findViewById(R.id.etPasswordOrganizer)
        etConfirmPasswordOrganizer = findViewById(R.id.etConfirmPasswordOrganizer)
        spinnerOrganizer = findViewById(R.id.spinnerOrganizer)
    }

    private fun setupSpinners() {
        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, departments)
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinnerParticipant.adapter = adapter
        spinnerOrganizer.adapter = adapter
    }

    private fun handleRegister() {
        tvError.visibility = View.GONE

        val firstName: String
        val lastName: String
        val email: String
        val password: String
        val confirmPassword: String
        val department: String

        if (role == "Participant") {
            firstName = etFirstName.text.toString().trim()
            lastName = etLastName.text.toString().trim()
            email = etEmailParticipant.text.toString().trim()
            password = etPasswordParticipant.text.toString().trim()
            confirmPassword = etConfirmPasswordParticipant.text.toString().trim()
            department = spinnerParticipant.selectedItem.toString()
        } else {
            firstName = etOrgName.text.toString().trim()
            lastName = firstName
            email = etEmailOrganizer.text.toString().trim()
            password = etPasswordOrganizer.text.toString().trim()
            confirmPassword = etConfirmPasswordOrganizer.text.toString().trim()
            department = spinnerOrganizer.selectedItem.toString()
        }

        if (firstName.isEmpty() || email.isEmpty() || password.isEmpty() || confirmPassword.isEmpty()) {
            showError("All fields are required"); return
        }
        if (role == "Participant" && lastName.isEmpty()) {
            showError("Last name is required"); return
        }
        if (department == "Choose Department") {
            showError("Please choose a department"); return
        }
        if (password != confirmPassword) {
            showError("Passwords do not match"); return
        }
        if (password.length < 8) {
            showError("Password must be at least 8 characters"); return
        }

        btnRegister.isEnabled = false
        btnRegister.text = "registering..."

        lifecycleScope.launch {
            try {
                val response = RetrofitClient.instance.register(
                    RegisterRequest(firstName, lastName, email, password, confirmPassword, department, role)
                )
                if (response.isSuccessful && response.body()?.success == true) {
                    Toast.makeText(this@RegisterActivity, "Registration successful! Please log in.", Toast.LENGTH_LONG).show()
                    startActivity(Intent(this@RegisterActivity, LoginActivity::class.java).apply {
                        putExtra("role", role)
                        flags = Intent.FLAG_ACTIVITY_CLEAR_TOP
                    })
                    finish()
                } else {
                    showError(response.body()?.message ?: "Registration failed.")
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