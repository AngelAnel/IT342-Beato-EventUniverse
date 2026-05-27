package edu.cit.beato.eventuniverse.feature.auth

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.EditText
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.AppCompatButton
import androidx.lifecycle.lifecycleScope
import edu.cit.beato.eventuniverse.R
import edu.cit.beato.eventuniverse.api.LoginRequest
import edu.cit.beato.eventuniverse.api.RetrofitClient
import edu.cit.beato.eventuniverse.feature.home.HomeActivity
import kotlinx.coroutines.launch
import android.widget.Toast
class LoginActivity : AppCompatActivity() {

    private lateinit var etEmail: EditText
    private lateinit var etPassword: EditText
    private lateinit var btnLogin: AppCompatButton
    private lateinit var tvError: TextView
    private lateinit var tvTitle: TextView
    private lateinit var tvRegisterLink: TextView
    private var role: String = "Participant"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)
        supportActionBar?.hide()

        role = intent.getStringExtra("role") ?: "Participant"

        etEmail = findViewById(R.id.etEmail)
        etPassword = findViewById(R.id.etPassword)
        btnLogin = findViewById(R.id.btnLogin)
        tvError = findViewById(R.id.tvError)
        tvTitle = findViewById(R.id.tvTitle)
        tvRegisterLink = findViewById(R.id.tvRegisterLink)

        tvTitle.text = if (role == "Participant") "Login as Participant" else "Login as Organizer"

        findViewById<View>(R.id.btnBack).setOnClickListener {
            startActivity(Intent(this, LandingActivity::class.java))
            finish()
        }

        tvRegisterLink.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java).apply {
                putExtra("role", role)
            })
            finish()
        }

        btnLogin.setOnClickListener { handleLogin() }
    }

    private fun handleLogin() {
        Toast.makeText(this, "Button clicked!", Toast.LENGTH_SHORT).show()
        val email = etEmail.text.toString().trim()
        val password = etPassword.text.toString().trim()

        if (email.isEmpty() || password.isEmpty()) {
            showError("Please fill in all fields")
            return
        }

        btnLogin.isEnabled = false
        btnLogin.text = "logging in..."
        tvError.visibility = View.GONE

        lifecycleScope.launch {
            try {
                val response = RetrofitClient.instance.login(LoginRequest(email, password))
                if (response.isSuccessful && response.body()?.success == true) {
                    val user = response.body()?.data?.user

                    if (user?.role != role) {
                        showError("This account is not a ${if (role == "Participant") "participant" else "organizer"} account.")
                        return@launch
                    }

                    startActivity(Intent(this@LoginActivity, HomeActivity::class.java).apply {
                        putExtra("firstName", user.firstName ?: "")
                        putExtra("email", user.email ?: "")
                        putExtra("role", user.role ?: "")
                        putExtra("token", response.body()?.data?.accessToken ?: "")
                    })
                    finish()
                } else {
                    showError(response.body()?.message ?: "Invalid email or password")
                }
            } catch (e: Exception) {
                showError("Connection failed. Make sure backend is running.")
            } finally {
                btnLogin.isEnabled = true
                btnLogin.text = "login"
            }
        }
    }

    private fun showError(message: String) {
        tvError.text = message
        tvError.visibility = View.VISIBLE
    }
}