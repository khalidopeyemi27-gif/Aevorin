import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const AevorinApp());
}

class AevorinApp extends StatelessWidget {
  const AevorinApp({super.key});

  @override
  Widget build(BuildContext context) {
    // Custom Aevorin Theme Constants
    const Color backgroundDark = Color(0xFF070913);
    const Color primaryPurple = Color(0xFF8B5CF6);
    const Color accentGold = Color(0xFFF5C542);
    const Color textLight = Color(0xFFF3F4F6);
    const Color cardDark = Color(0xFF111322);

    return MaterialApp(
      title: 'Aevorin Mobile',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: backgroundDark,
        primaryColor: primaryPurple,
        colorScheme: const ColorScheme.dark(
          primary: primaryPurple,
          secondary: accentGold,
          background: backgroundDark,
          surface: cardDark,
        ),
        textTheme: const TextTheme(
          bodyLarge: TextStyle(color: textLight),
          bodyMedium: TextStyle(color: textLight),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: cardDark,
          labelStyle: const TextStyle(color: Colors.grey),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: primaryPurple, width: 2),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Colors.grey, width: 1),
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: primaryPurple,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 32),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            textStyle: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.1,
            ),
          ),
        ),
      ),
      home: const MainGateScreen(),
    );
  }
}

class MainGateScreen extends StatefulWidget {
  const MainGateScreen({super.key});

  @override
  State<MainGateScreen> createState() => _MainGateScreenState();
}

class _MainGateScreenState extends State<MainGateScreen> {
  final TextEditingController _urlController =
      TextEditingController(text: 'http://10.0.2.2:5180');
  
  late final WebViewController _webViewController;
  bool _isConnected = false;
  bool _isLoadingWebView = false;

  @override
  void initState() {
    super.initState();
    _initWebViewController();
  }

  void _initWebViewController() {
    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF070913))
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            setState(() {
              _isLoadingWebView = true;
            });
          },
          onPageFinished: (String url) {
            setState(() {
              _isLoadingWebView = false;
            });
          },
        ),
      )
      // Register the unified JavaScript interface bridge
      ..addJavaScriptChannel(
        'AndroidBridge',
        onMessageReceived: (JavaScriptMessage message) {
          final command = message.message;
          if (command == 'disconnect') {
            setState(() {
              _isConnected = false;
            });
          } else if (command == 'refresh') {
            _webViewController.reload();
          }
        },
      );
  }

  void _connectToSanctuary() {
    final targetUrl = _urlController.text.trim();
    if (targetUrl.isNotEmpty) {
      _webViewController.loadRequest(Uri.parse(targetUrl));
      setState(() {
        _isConnected = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isConnected) {
      return Scaffold(
        body: SafeArea(
          child: Stack(
            children: [
              WebViewWidget(controller: _webViewController),
              if (_isLoadingWebView)
                const Center(
                  child: CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF8B5CF6)),
                  ),
                ),
            ],
          ),
        ),
      );
    }

    // Aevorin Main Connection Gate UI
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                '⚔ AEVORIN ⚔',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFFF5C542),
                  letterSpacing: 2.0,
                  shadows: [
                    Shadow(
                      color: Color(0xAA8B5CF6),
                      blurRadius: 10,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'v2.0 Sanctuary Mobile Client',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.grey,
                  fontSize: 14,
                  letterSpacing: 1.1,
                ),
              ),
              const SizedBox(height: 48),
              TextField(
                controller: _urlController,
                keyboardType: TextInputType.url,
                autocorrect: false,
                decoration: const InputDecoration(
                  labelText: 'Sanctuary Node URL',
                  hintText: 'http://10.0.2.2:5180',
                  prefixIcon: Icon(Icons.link, color: Color(0xFF8B5CF6)),
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _connectToSanctuary,
                child: const Text('CONNECT TO WORKSPACE'),
              ),
              const SizedBox(height: 48),
              const Text(
                'Ensure local engine server is online.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
