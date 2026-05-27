package edu.cit.beato.eventuniverse.feature.auth

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import androidx.appcompat.app.AppCompatActivity
import edu.cit.beato.eventuniverse.R

class LandingActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_landing)
        supportActionBar?.hide()

        findViewById<Button>(R.id.btnLoginParticipant).setOnClickListener {
            startActivity(Intent(this, LoginActivity::class.java).apply {
                putExtra("role", "Participant")
            })
        }
        findViewById<Button>(R.id.btnLoginOrganizer).setOnClickListener {
            startActivity(Intent(this, LoginActivity::class.java).apply {
                putExtra("role", "Organization")
            })
        }
        findViewById<Button>(R.id.btnRegisterParticipant).setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java).apply {
                putExtra("role", "Participant")
            })
        }
        findViewById<Button>(R.id.btnRegisterOrganizer).setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java).apply {
                putExtra("role", "Organization")
            })
        }
    }
}