import 'dart:convert';

class FruitItem {
  final String id;
  String name;
  String icon;
  int quantity;

  FruitItem({
    required this.id,
    required this.name,
    required this.icon,
    required this.quantity,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'icon': icon,
      'quantity': quantity,
    };
  }

  factory FruitItem.fromMap(Map<String, dynamic> map) {
    return FruitItem(
      id: map['id'] ?? '',
      name: map['name'] ?? '',
      icon: map['icon'] ?? '🥕',
      quantity: (map['quantity'] as num?)?.toInt() ?? 0,
    );
  }

  String toJson() => json.encode(toMap());

  factory FruitItem.fromJson(String source) => FruitItem.fromMap(json.decode(source));
}

class Account {
  final String id;
  String username;
  String password;
  String characterName;
  String roleId;
  String status; // 'active', 'banned', 'wrong_pw', 'pending'
  String note;
  int stars;
  int gameBucks;
  int gems;
  int goldBars;
  int boxes;
  int tickets;
  int eventPoints;
  List<FruitItem> fruits;
  DateTime updatedAt;

  Account({
    required this.id,
    required this.username,
    this.password = '',
    required this.characterName,
    required this.roleId,
    this.status = 'active',
    this.note = '',
    this.stars = 1,
    this.gameBucks = 0,
    this.gems = 0,
    this.goldBars = 0,
    this.boxes = 0,
    this.tickets = 0,
    this.eventPoints = 0,
    required this.fruits,
    required this.updatedAt,
  });

  int get totalFruits => fruits.fold(0, (sum, f) => sum + f.quantity);

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'username': username,
      'password': password,
      'characterName': characterName,
      'roleId': roleId,
      'status': status,
      'note': note,
      'stars': stars,
      'gameBucks': gameBucks,
      'gems': gems,
      'goldBars': goldBars,
      'boxes': boxes,
      'tickets': tickets,
      'eventPoints': eventPoints,
      'fruits': fruits.map((x) => x.toMap()).toList(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  factory Account.fromMap(Map<String, dynamic> map) {
    return Account(
      id: map['id'] ?? '',
      username: map['username'] ?? '',
      password: map['password'] ?? '',
      characterName: map['characterName'] ?? map['username'] ?? '',
      roleId: map['roleId'] ?? '',
      status: map['status'] ?? 'active',
      note: map['note'] ?? '',
      stars: (map['stars'] as num?)?.toInt() ?? 1,
      gameBucks: (map['gameBucks'] as num?)?.toInt() ?? 0,
      gems: (map['gems'] as num?)?.toInt() ?? 0,
      goldBars: (map['goldBars'] as num?)?.toInt() ?? 0,
      boxes: (map['boxes'] as num?)?.toInt() ?? 0,
      tickets: (map['tickets'] as num?)?.toInt() ?? 0,
      eventPoints: (map['eventPoints'] as num?)?.toInt() ?? 0,
      fruits: (map['fruits'] as List<dynamic>?)
              ?.map((x) => FruitItem.fromMap(x as Map<String, dynamic>))
              .toList() ??
          [],
      updatedAt: DateTime.tryParse(map['updatedAt'] ?? '') ?? DateTime.now(),
    );
  }
}
