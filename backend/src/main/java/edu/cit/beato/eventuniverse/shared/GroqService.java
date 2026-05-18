package edu.cit.beato.eventuniverse.shared;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.json.JSONArray;
import org.json.JSONObject;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Service
public class GroqService {

    private final String groqUrl = "https://api.groq.com/openai/v1/chat/completions";
    private final String apiKey;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public GroqService(@Value("${groq.api.key}") String apiKey) {
        this.apiKey = apiKey;
    }

    public String analyzePaymentProof(String base64Image) {
        try {
            String imageData = base64Image;
            String mimeType = "image/jpeg";
            if (base64Image.contains(",")) {
                String header = base64Image.substring(0, base64Image.indexOf(","));
                imageData = base64Image.substring(base64Image.indexOf(",") + 1);
                if (header.contains("png")) mimeType = "image/png";
                else if (header.contains("webp")) mimeType = "image/webp";
            }


            JSONObject imageUrl = new JSONObject();
            imageUrl.put("url", "data:" + mimeType + ";base64," + imageData);

            JSONObject imageContent = new JSONObject();
            imageContent.put("type", "image_url");
            imageContent.put("image_url", imageUrl);


            JSONObject textContent = new JSONObject();
            textContent.put("type", "text");
            textContent.put("text",
                    "This is a proof of payment image submitted by a student for event registration. " +
                            "Please analyze it and provide a brief, clear summary of the payment details visible. " +
                            "Include: payment method (GCash, bank transfer, cash, etc.), amount if visible, " +
                            "sender/receiver details if visible, date and time if visible, " +
                            "and reference/transaction number if visible. " +
                            "If this does not appear to be a valid payment proof, say so clearly. " +
                            "Keep the summary concise and factual, maximum 3 sentences."
            );

            JSONArray contentArray = new JSONArray();
            contentArray.put(textContent);
            contentArray.put(imageContent);

            JSONObject message = new JSONObject();
            message.put("role", "user");
            message.put("content", contentArray);

            JSONArray messages = new JSONArray();
            messages.put(message);

            JSONObject requestBody = new JSONObject();
            requestBody.put("model", "meta-llama/llama-4-scout-17b-16e-instruct");
            requestBody.put("messages", messages);
            requestBody.put("max_tokens", 300);
            requestBody.put("temperature", 0.1);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(groqUrl))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody.toString()))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            System.out.println("Groq status: " + response.statusCode());
            System.out.println("Groq response: " + response.body());

            if (response.statusCode() != 200) {
                return "AI analysis unavailable.";
            }

            JSONObject json = new JSONObject(response.body());
            return json
                    .getJSONArray("choices")
                    .getJSONObject(0)
                    .getJSONObject("message")
                    .getString("content");

        } catch (Exception e) {
            System.err.println("Groq API error: " + e.getMessage());
            e.printStackTrace();
            return "AI analysis unavailable.";
        }
    }
}
