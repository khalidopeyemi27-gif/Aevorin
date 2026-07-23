import 'dart:math';

/// Dart implementation of ULID (Universally Unique Lexicographically Sortable Identifier).
/// Time-sortable, globally unique, no external dependencies.
///
/// Format: ttttttttttrrrrrrrrrrrrrrrrr
///   - 10 chars timestamp (ms since epoch, base32 Crockford)
///   - 16 chars random
class Ulid {
  static const String _encoding = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  static const int _encodingLen = 32;
  static final Random _rng = Random.secure();

  static int? _lastTime;
  static List<int> _lastRandom = List.filled(16, 0);

  /// Generates a new ULID string.
  static String generate() {
    final ms = DateTime.now().millisecondsSinceEpoch;
    final random = _nextRandom(ms);
    return _encodeTime(ms, 10) + _encodeRandom(random, 16);
  }

  static List<int> _nextRandom(int ms) {
    if (_lastTime != null && ms == _lastTime) {
      // Same millisecond — increment the random portion
      return _incrementRandom(List<int>.from(_lastRandom));
    }
    _lastTime = ms;
    _lastRandom = List.generate(16, (_) => _rng.nextInt(_encodingLen));
    return List<int>.from(_lastRandom);
  }

  static List<int> _incrementRandom(List<int> random) {
    for (int i = random.length - 1; i >= 0; i--) {
      if (random[i] < _encodingLen - 1) {
        random[i]++;
        break;
      }
      random[i] = 0;
    }
    _lastRandom = List<int>.from(random);
    return random;
  }

  static String _encodeTime(int time, int len) {
    final chars = List<String>.filled(len, '0');
    for (int i = len - 1; i >= 0; i--) {
      chars[i] = _encoding[time % _encodingLen];
      time ~/= _encodingLen;
    }
    return chars.join();
  }

  static String _encodeRandom(List<int> random, int len) {
    return List.generate(len, (i) => _encoding[random[i] % _encodingLen]).join();
  }
}
