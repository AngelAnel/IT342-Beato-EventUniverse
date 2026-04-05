package edu.cit.beato.eventuniverse

import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class HomeActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_home)

        val firstName = intent.getStringExtra("firstName") ?: ""
        val email = intent.getStringExtra("email") ?: ""
        val role = intent.getStringExtra("role") ?: ""

        val tvWelcome = findViewById<TextView>(R.id.tvWelcome)
        tvWelcome.text = "Welcome, $firstName!\n$email\nRole: $role"
    }
}