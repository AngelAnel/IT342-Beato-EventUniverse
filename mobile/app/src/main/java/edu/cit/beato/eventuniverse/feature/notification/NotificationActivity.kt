package edu.cit.beato.eventuniverse.feature.notification

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import edu.cit.beato.eventuniverse.R
import edu.cit.beato.eventuniverse.api.NotificationData
import edu.cit.beato.eventuniverse.api.RetrofitClient
import kotlinx.coroutines.*
import java.text.SimpleDateFormat
import java.util.*

class NotificationActivity : AppCompatActivity() {

    private var token = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_notification)
        supportActionBar?.hide()

        token = intent.getStringExtra("token") ?: ""

        findViewById<View>(R.id.ivBack).setOnClickListener { finish() }

        val rv = findViewById<RecyclerView>(R.id.rvNotifications)
        rv.layoutManager = LinearLayoutManager(this)

        loadNotifications(rv)
    }

    private fun loadNotifications(rv: RecyclerView) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val res = RetrofitClient.instance.getNotifications("Bearer $token")
                if (res.isSuccessful && res.body()?.success == true) {
                    val notifications = res.body()?.data ?: emptyList()

                    // Mark all as read
                    try {
                        RetrofitClient.instance.markNotificationsRead("Bearer $token")
                    } catch (e: Exception) { /* silent */ }

                    withContext(Dispatchers.Main) {
                        val tvEmpty = findViewById<TextView>(R.id.tvEmpty)
                        if (notifications.isEmpty()) {
                            tvEmpty.visibility = View.VISIBLE
                            rv.visibility = View.GONE
                        } else {
                            tvEmpty.visibility = View.GONE
                            rv.visibility = View.VISIBLE
                            rv.adapter = NotificationAdapter(notifications)
                        }
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    findViewById<TextView>(R.id.tvEmpty).visibility = View.VISIBLE
                    rv.visibility = View.GONE
                }
            }
        }
    }
}

class NotificationAdapter(
    private val notifications: List<NotificationData>
) : RecyclerView.Adapter<NotificationAdapter.ViewHolder>() {

    inner class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val tvTitle: TextView = itemView.findViewById(R.id.tvTitle)
        val tvMessage: TextView = itemView.findViewById(R.id.tvMessage)
        val tvTime: TextView = itemView.findViewById(R.id.tvTime)
        val viewUnread: View = itemView.findViewById(R.id.viewUnread)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_notification, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val notif = notifications[position]
        holder.tvTitle.text = notif.title
        holder.tvMessage.text = notif.message
        holder.tvTime.text = getTimeAgo(notif.createdAt)
        holder.viewUnread.visibility = if (!notif.isRead) View.VISIBLE else View.GONE
    }

    override fun getItemCount() = notifications.size

    private fun getTimeAgo(dateTimeStr: String?): String {
        if (dateTimeStr.isNullOrEmpty()) return ""
        return try {
            val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
            val date = sdf.parse(dateTimeStr) ?: return ""
            val diff = System.currentTimeMillis() - date.time
            val minutes = diff / 60000
            val hours = minutes / 60
            val days = hours / 24
            when {
                minutes < 1 -> "just now"
                minutes < 60 -> "$minutes minutes ago"
                hours < 24 -> "$hours hours ago"
                days < 7 -> "$days days ago"
                else -> SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()).format(date)
            }
        } catch (e: Exception) { "" }
    }
}