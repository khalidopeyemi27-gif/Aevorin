package com.example.aevorin.ui.main

import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebSettings
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.navigation3.runtime.NavKey

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
  onItemClick: (NavKey) -> Unit,
  modifier: Modifier = Modifier,
  viewModel: Any? = null
) {
  var serverUrl by remember { mutableStateOf("http://10.0.2.2:5180") }
  var isConnected by remember { mutableStateOf(false) }

  // Hold a reference to the WebView so the Refresh button can call reload()
  var webViewRef by remember { mutableStateOf<WebView?>(null) }

  if (isConnected) {
    Box(modifier = Modifier.fillMaxSize()) {

      AndroidView(
        factory = { context ->
          WebView(context).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            settings.cacheMode = WebSettings.LOAD_NO_CACHE
            settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            clearCache(true)
            webViewClient = WebViewClient()
            addJavascriptInterface(object {
              @android.webkit.JavascriptInterface
              fun disconnect() {
                post {
                  isConnected = false
                }
              }
              @android.webkit.JavascriptInterface
              fun refresh() {
                post {
                  clearCache(true);
                  reload()
                }
              }
            }, "AndroidBridge")
            loadUrl(serverUrl)
          }.also { webViewRef = it }
        },
        modifier = Modifier.fillMaxSize()
      )
    }

  } else {
    Column(
      modifier = Modifier
        .fillMaxSize()
        .padding(24.dp),
      verticalArrangement = Arrangement.Center,
      horizontalAlignment = Alignment.CenterHorizontally
    ) {
      Text(
        text = "⚔ AEVORIN ⚔",
        fontSize = 32.sp,
        fontWeight = FontWeight.Bold,
        color = Color(0xFFF5C542),
        textAlign = TextAlign.Center,
        modifier = Modifier.padding(bottom = 8.dp)
      )

      Text(
        text = "Writer's Sanctuary Connect",
        fontSize = 18.sp,
        fontWeight = FontWeight.Medium,
        color = Color.LightGray,
        textAlign = TextAlign.Center,
        modifier = Modifier.padding(bottom = 32.dp)
      )

      Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1E2E)),
        modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp)
      ) {
        Column(modifier = Modifier.padding(16.dp)) {
          Text(
            text = "Enter Local Server Address:",
            fontSize = 14.sp,
            color = Color.Gray,
            modifier = Modifier.padding(bottom = 8.dp)
          )

          OutlinedTextField(
            value = serverUrl,
            onValueChange = { serverUrl = it },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
          )

          Spacer(modifier = Modifier.height(12.dp))

          Text(
            text = "💡 Emulator: http://10.0.2.2:5180\n💡 Wi-Fi Phone: http://[your-pc-ip]:5180",
            fontSize = 12.sp,
            color = Color.Gray,
            lineHeight = 16.sp
          )
        }
      }

      Button(
        onClick = { if (serverUrl.isNotBlank()) isConnected = true },
        shape = RoundedCornerShape(8.dp),
        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6)),
        modifier = Modifier.fillMaxWidth().height(50.dp)
      ) {
        Text(
          "Connect to Workspace →",
          color = Color.White,
          fontSize = 16.sp,
          fontWeight = FontWeight.Bold
        )
      }
    }
  }
}
