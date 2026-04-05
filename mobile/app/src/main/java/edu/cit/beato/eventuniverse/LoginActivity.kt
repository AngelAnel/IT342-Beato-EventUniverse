package edu.cit.beato.eventuniverse

import android.content.Intent
import android.os.Bundle
import android.text.SpannableString
import android.text.Spanned
import android.text.style.UnderlineSpan
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ImageView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import edu.cit.beato.eventuniverse.api.LoginRequest
import edu.cit.beato.eventuniverse.api.RetrofitClient
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {

    private lateinit var etEmail: EditText
    private lateinit var etPassword: EditText
    private lateinit var btnLogin: androidx.appcompat.widget.AppCompatButton
    private lateinit var tvError: TextView
    private lateinit var tvRegisterLink: TextView
    private lateinit var ivLogo: ImageView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        etEmail = findViewById(R.id.etEmail)
        etPassword = findViewById(R.id.etPassword)
        btnLogin = findViewById(R.id.btnLogin)
        tvError = findViewById(R.id.tvError)
        tvRegisterLink = findViewById(R.id.tvRegisterLink)
        ivLogo = findViewById(R.id.ivLogo)

        // Underline "Register here"
        val fullText = "Still don't have an account? Register here"
        val spannable = SpannableString(fullText)
        val start = fullText.indexOf("Register here")
        spannable.setSpan(UnderlineSpan(), start, fullText.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        tvRegisterLink.text = spannable

        btnLogin.setOnClickListener { handleLogin() }

        // Logo click — stays on login (already here)
        ivLogo.setOnClickListener { /* already on login */ }

        tvRegisterLink.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }
    }

    private fun handleLogin() {
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
                    val intent = Intent(this@LoginActivity, HomeActivity::class.java)
                    intent.putExtra("firstName", user?.firstName ?: "")
                    intent.putExtra("email", user?.email ?: "")
                    intent.putExtra("role", user?.role ?: "")
                    startActivity(intent)
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