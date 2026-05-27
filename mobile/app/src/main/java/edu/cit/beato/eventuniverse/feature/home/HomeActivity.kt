package edu.cit.beato.eventuniverse.feature.home

import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import edu.cit.beato.eventuniverse.R
//import edu.cit.beato.eventuniverse.api.ApiModels
import edu.cit.beato.eventuniverse.api.EventData
import edu.cit.beato.eventuniverse.api.RetrofitClient
//import edu.cit.beato.eventuniverse.feature.profile.ProfileActivity
import kotlinx.coroutines.*
import edu.cit.beato.eventuniverse.feature.profile.ProfileActivity
class HomeActivity : AppCompatActivity() {

    private lateinit var adapter: EventAdapter
    private var allEvents: List<EventData> = emptyList()
    private var currentPage = "home" // home, myevents, archive
    private var token = ""
    private var firstName = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_home)
        supportActionBar?.hide()

        token = intent.getStringExtra("token") ?: ""
        firstName = intent.getStringExtra("firstName") ?: ""
        val role = intent.getStringExtra("role") ?: ""

        // Fix hint text color (android:hintTextColor not supported in XML for EditText)
        findViewById<EditText>(R.id.etSearch)
            .setHintTextColor(android.graphics.Color.parseColor("#aaaaaa"))

        // Welcome message
        findViewById<TextView>(R.id.tvWelcome).text =
            "Hello there, $firstName! Welcome Back"

        // Setup RecyclerView
        val rv = findViewById<RecyclerView>(R.id.rvEvents)
        rv.layoutManager = LinearLayoutManager(this)
        adapter = EventAdapter(emptyList()) { event ->
            onActionClick(event)
        }
        rv.adapter = adapter

        // Bottom nav
        findViewById<LinearLayout>(R.id.navHome).setOnClickListener {
            switchPage("home")
        }
        findViewById<LinearLayout>(R.id.navMyEvents).setOnClickListener {
            switchPage("myevents")
        }
        findViewById<LinearLayout>(R.id.navProfile).setOnClickListener {
            showProfileOptions()
        }

        // Bell
        findViewById<View>(R.id.ivBell).setOnClickListener {
            startActivity(Intent(this,
                edu.cit.beato.eventuniverse.feature.notification.NotificationActivity::class.java).apply {
                putExtra("token", token)
            })
        }

        // Search
        findViewById<EditText>(R.id.etSearch).addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable?) { filterEvents(s.toString()) }
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
        })

        // Load initial data
        switchPage("home")
    }

    private fun switchPage(page: String) {
        currentPage = page
        val title = when (page) {
            "home" -> "Home"
            "myevents" -> "My Events"
            "archive" -> "Archive"
            else -> "Home"
        }
        findViewById<TextView>(R.id.tvPageTitle).text = title
        loadData()
    }

    private fun loadData() {
        showEmpty(false)
        CoroutineScope(Dispatchers.IO).launch {
            try {
                when (currentPage) {
                    "home" -> {
                        val res = RetrofitClient.instance.getParticipantEvents("Bearer $token")
                        if (res.isSuccessful && res.body()?.success == true) {
                            allEvents = res.body()?.data ?: emptyList()
                            // Fetch slot counts to determine action labels
                            val labels = mutableMapOf<String, String>()
                            for (event in allEvents) {
                                try {
                                    val slotRes = RetrofitClient.instance.getSlotCounts(
                                        "Bearer $token", event.id
                                    )
                                    if (slotRes.isSuccessful) {
                                        val data = slotRes.body()?.data
                                        if (data?.alreadyRegistered == true &&
                                            data.myRegistration?.status == "Confirmed") {
                                            labels[event.id] = "Registered"
                                        } else if (data?.alreadyRegistered == true) {
                                            labels[event.id] = "Pending"
                                        } else {
                                            labels[event.id] = "Register"
                                        }
                                    }
                                } catch (e: Exception) {
                                    labels[event.id] = "Register"
                                }
                            }
                            withContext(Dispatchers.Main) {
                                adapter.updateEvents(allEvents)
                                adapter.setActionLabels(labels)
                                showEmpty(allEvents.isEmpty())
                            }
                        }
                    }
                    "myevents" -> {
                        val res = RetrofitClient.instance.getMyConfirmedRegistrations("Bearer $token")
                        if (res.isSuccessful && res.body()?.success == true) {
                            val myEvents = res.body()?.data ?: emptyList()
                            allEvents = myEvents.map { it.toEventData() }
                            withContext(Dispatchers.Main) {
                                adapter.updateEvents(allEvents)
                                adapter.setActionLabels(allEvents.associate { it.id to "View Details" })
                                showEmpty(allEvents.isEmpty())
                            }
                        }
                    }
                    "archive" -> {
                        val res = RetrofitClient.instance.getMyArchivedRegistrations("Bearer $token")
                        if (res.isSuccessful && res.body()?.success == true) {
                            val archived = res.body()?.data ?: emptyList()
                            allEvents = archived.map { it.toEventData() }
                            withContext(Dispatchers.Main) {
                                adapter.updateEvents(allEvents)
                                adapter.setActionLabels(allEvents.associate { it.id to "View Details" })
                                showEmpty(allEvents.isEmpty())
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    showEmpty(true)
                }
            }
        }
    }

    private fun filterEvents(query: String) {
        if (query.isEmpty()) {
            adapter.updateEvents(allEvents)
            return
        }
        val filtered = allEvents.filter {
            it.eventName.contains(query, ignoreCase = true) ||
                    it.venue.contains(query, ignoreCase = true) ||
                    (it.departments ?: "").contains(query, ignoreCase = true)
        }
        adapter.updateEvents(filtered)
        showEmpty(filtered.isEmpty())
    }

    private fun onActionClick(event: EventData) {
        when (currentPage) {
            "home" -> {
                val sheet = RegisterBottomSheet.newInstance(event, token) {
                    // Refresh after successful registration
                    loadData()
                }
                sheet.show(supportFragmentManager, "RegisterBottomSheet")
            }
            "myevents", "archive" -> {
                // TODO: open view details (next step)
            }
        }
    }

    private fun showProfileOptions() {
        val options = arrayOf("Profile", "Logout")
        android.app.AlertDialog.Builder(this)
            .setTitle("Account")
            .setItems(options) { _, which ->
                when (which) {
                    0 -> {
                        startActivity(Intent(this, ProfileActivity::class.java).apply {
                            putExtra("token", token)
                        })
                    }
                    1 -> {
                        android.app.AlertDialog.Builder(this)
                            .setTitle("Logout")
                            .setMessage("Are you sure you want to logout?")
                            .setPositiveButton("Logout") { _, _ ->
                                val i = Intent(this,
                                    edu.cit.beato.eventuniverse.feature.auth.LandingActivity::class.java)
                                i.flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                                        Intent.FLAG_ACTIVITY_CLEAR_TASK
                                startActivity(i)
                            }
                            .setNegativeButton("Cancel", null)
                            .show()
                    }
                }
            }.show()
    }

    private fun showEmpty(show: Boolean) {
        findViewById<TextView>(R.id.tvEmpty).visibility =
            if (show) View.VISIBLE else View.GONE
        findViewById<RecyclerView>(R.id.rvEvents).visibility =
            if (show) View.GONE else View.VISIBLE
    }
}

// Extension to convert MyEventData to EventData for reuse in adapter
fun edu.cit.beato.eventuniverse.api.MyEventData.toEventData() =
    EventData(
        id = eventId,
        eventName = eventName,
        venue = venue,
        eventDateTime = eventDateTime,
        departments = departments,
        picture = picture,
        categoriesEnabled = categoriesEnabled,
        categories = categories,
        gcashEnabled = gcashEnabled,
        onsiteEnabled = onsiteEnabled,
        maxParticipantsEnabled = false,
        maxParticipants = null,
        attachmentEnabled = false,
        attachmentInstructions = null,
        gcashQrs = null,
        onsitePersonnel = null,
        onsiteLocation = null,
        onsiteStart = null,
        onsiteEnd = null,
        organizerName = organizerName
    )