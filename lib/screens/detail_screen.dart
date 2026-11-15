import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/account.dart';
import '../theme/app_theme.dart';

class DetailScreen extends StatefulWidget {
  final Account account;
  final Function(Account) onSave;
  final Function(String) onDelete;

  const DetailScreen({
    super.key,
    required this.account,
    required this.onSave,
    required this.onDelete,
  });

  @override
  State<DetailScreen> createState() => _DetailScreenState();
}

class _DetailScreenState extends State<DetailScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late TextEditingController _usernameController;
  late TextEditingController _passwordController;
  late TextEditingController _charNameController;
  late TextEditingController _roleIdController;
  late TextEditingController _noteController;

  late int _stars;
  late int _gameBucks;
  late int _gems;
  late int _goldBars;
  late int _boxes;
  late int _tickets;
  late int _eventPoints;
  late String _status;
  late List<FruitItem> _fruits;

  bool _obscurePassword = true;

  // New fruit state
  bool _showAddFruit = false;
  final TextEditingController _newFruitNameCtrl = TextEditingController();
  final TextEditingController _newFruitQtyCtrl = TextEditingController(text: '10');
  String _selectedEmoji = '🥕';

  final List<String> _commonEmojis = [
    '🥕', '🍅', '🍎', '🌽', '🍓', '🌾', '🥬', '🍉', '🌶️', '🍄', '🍇', '🥑', '🍊', '🍌', '🍍', '🥜', '🥦', '🥔'
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _usernameController = TextEditingController(text: widget.account.username);
    _passwordController = TextEditingController(text: widget.account.password);
    _charNameController = TextEditingController(text: widget.account.characterName);
    _roleIdController = TextEditingController(text: widget.account.roleId);
    _noteController = TextEditingController(text: widget.account.note);

    _stars = widget.account.stars;
    _gameBucks = widget.account.gameBucks;
    _gems = widget.account.gems;
    _goldBars = widget.account.goldBars;
    _boxes = widget.account.boxes;
    _tickets = widget.account.tickets;
    _eventPoints = widget.account.eventPoints;
    _status = widget.account.status;
    _fruits = List.from(widget.account.fruits);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _usernameController.dispose();
    _passwordController.dispose();
    _charNameController.dispose();
    _roleIdController.dispose();
    _noteController.dispose();
    _newFruitNameCtrl.dispose();
    _newFruitQtyCtrl.dispose();
    super.dispose();
  }

  int get _totalFruits => _fruits.fold(0, (sum, f) => sum + f.quantity);

  void _saveChanges() {
    final updated = Account(
      id: widget.account.id,
      username: _usernameController.text.trim(),
      password: _passwordController.text.trim(),
      characterName: _charNameController.text.trim().isEmpty
          ? _usernameController.text.trim()
          : _charNameController.text.trim(),
      roleId: _roleIdController.text.trim(),
      status: _status,
      note: _noteController.text.trim(),
      stars: _stars,
      gameBucks: _gameBucks,
      gems: _gems,
      goldBars: _goldBars,
      boxes: _boxes,
      tickets: _tickets,
      eventPoints: _eventPoints,
      fruits: _fruits,
      updatedAt: DateTime.now(),
    );

    widget.onSave(updated);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Đã lưu thay đổi thành công!'),
        backgroundColor: AppTheme.accentGreen,
      ),
    );
    Navigator.of(context).pop();
  }

  void _confirmDelete() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xác nhận xóa tài khoản'),
        content: Text('Bạn có chắc muốn xóa tài khoản "${widget.account.username}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.accentRose),
            onPressed: () {
              Navigator.of(ctx).pop();
              widget.onDelete(widget.account.id);
              Navigator.of(context).pop();
            },
            child: const Text('Xóa', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.account.username,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline, color: AppTheme.accentRose),
            tooltip: 'Xóa tài khoản này',
            onPressed: _confirmDelete,
          ),
          const SizedBox(width: 8),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.accentCyan,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            icon: const Icon(Icons.save, size: 18),
            label: const Text('Lưu'),
            onPressed: _saveChanges,
          ),
          const SizedBox(width: 16),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppTheme.accentCyan,
          tabs: [
            const Tab(icon: Icon(Icons.person), text: 'Thông tin & Tài nguyên'),
            Tab(
              icon: const Icon(Icons.agriculture),
              text: 'Kho Nông Sản ($_totalFruits)',
            ),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildInfoTab(isDark),
          _buildFarmTab(isDark),
        ],
      ),
    );
  }

  Widget _buildInfoTab(bool isDark) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Basic info card
          Card(
            color: isDark ? AppTheme.darkCard : AppTheme.lightCard,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: BorderSide(color: isDark ? AppTheme.darkBorder : AppTheme.lightBorder),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'THÔNG TIN ĐĂNG NHẬP',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.1,
                      color: AppTheme.accentCyan,
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _usernameController,
                    decoration: const InputDecoration(
                      labelText: 'Tên tài khoản / Đăng nhập',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    decoration: InputDecoration(
                      labelText: 'Mật khẩu',
                      border: const OutlineInputBorder(),
                      suffixIcon: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: Icon(_obscurePassword ? Icons.visibility : Icons.visibility_off),
                            onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                          ),
                          IconButton(
                            icon: const Icon(Icons.copy),
                            onPressed: () {
                              Clipboard.setData(ClipboardData(text: _passwordController.text));
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Đã sao chép mật khẩu!')),
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _charNameController,
                    decoration: const InputDecoration(
                      labelText: 'Tên nhân vật in-game',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _roleIdController,
                    decoration: InputDecoration(
                      labelText: 'Role ID (Mã nhân vật)',
                      border: const OutlineInputBorder(),
                      suffixIcon: IconButton(
                        icon: const Icon(Icons.copy),
                        onPressed: () {
                          Clipboard.setData(ClipboardData(text: _roleIdController.text));
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Đã sao chép Role ID!')),
                          );
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Tình trạng tài khoản:',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      _statusChip('active', '🟢 Vào được', AppTheme.accentGreen),
                      _statusChip('banned', '🔴 Bị khóa', AppTheme.accentRose),
                      _statusChip('wrong_pw', '🟡 Sai mật khẩu', AppTheme.accentAmber),
                      _statusChip('pending', '⚪ Chưa kiểm tra', AppTheme.darkSubtext),
                    ],
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),

          // Resources card
          Card(
            color: isDark ? AppTheme.darkCard : AppTheme.lightCard,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: BorderSide(color: isDark ? AppTheme.darkBorder : AppTheme.lightBorder),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'TÀI NGUYÊN GAME',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.1,
                      color: AppTheme.accentAmber,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      _resourceInput('⭐ Cấp sao', _stars, (val) => setState(() => _stars = val)),
                      _resourceInput('💵 Tiền Sao', _gameBucks, (val) => setState(() => _gameBucks = val)),
                      _resourceInput('💎 Kim Cương', _gems, (val) => setState(() => _gems = val)),
                      _resourceInput('🧈 Thỏi Vàng', _goldBars, (val) => setState(() => _goldBars = val)),
                      _resourceInput('📦 Hộp quà', _boxes, (val) => setState(() => _boxes = val)),
                      _resourceInput('🎫 Vé & Phiếu', _tickets, (val) => setState(() => _tickets = val)),
                      _resourceInput('🍁 Điểm mùa', _eventPoints, (val) => setState(() => _eventPoints = val)),
                    ],
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),

          // Notes card
          Card(
            color: isDark ? AppTheme.darkCard : AppTheme.lightCard,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: BorderSide(color: isDark ? AppTheme.darkBorder : AppTheme.lightBorder),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'GHI CHÚ RIÊNG',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.1),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _noteController,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      hintText: 'Ghi chú thêm về tài khoản này...',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _statusChip(String val, String label, Color color) {
    final selected = _status == val;
    return ChoiceChip(
      selected: selected,
      label: Text(label),
      selectedColor: color.withValues(alpha: 0.2),
      side: BorderSide(color: selected ? color : Colors.transparent),
      onSelected: (bool s) {
        if (s) setState(() => _status = val);
      },
    );
  }

  Widget _resourceInput(String label, int value, Function(int) onChanged) {
    return SizedBox(
      width: 140,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          TextFormField(
            initialValue: value.toString(),
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              isDense: true,
              contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              border: OutlineInputBorder(),
            ),
            onChanged: (text) {
              final parsed = int.tryParse(text) ?? 0;
              onChanged(parsed);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildFarmTab(bool isDark) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Summary Banner
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: isDark
                    ? [const Color(0xFF064E3B).withValues(alpha: 0.4), const Color(0xFF1C1E22)]
                    : [Colors.green.shade100, Colors.white],
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.accentGreen.withValues(alpha: 0.3)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Text('🌾', style: TextStyle(fontSize: 32)),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Kho Nông Sản',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                        Text(
                          'Tổng cộng: $_totalFruits trái/nông sản',
                          style: const TextStyle(color: AppTheme.accentGreen, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ],
                ),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.accentGreen,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('Thêm loại trái'),
                  onPressed: () => setState(() => _showAddFruit = !_showAddFruit),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Add Fruit Form
          if (_showAddFruit) ...[
            Card(
              color: isDark ? AppTheme.darkCard : AppTheme.lightCard,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: const BorderSide(color: AppTheme.accentGreen),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'THÊM NÔNG SẢN MỚI',
                      style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.accentGreen),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          flex: 2,
                          child: TextField(
                            controller: _newFruitNameCtrl,
                            decoration: const InputDecoration(
                              labelText: 'Tên loại trái (VD: Dưa hấu, Nho)',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            controller: _newFruitQtyCtrl,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'Số lượng ban đầu',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Text('Chọn biểu tượng emoji:', style: TextStyle(fontSize: 12)),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _commonEmojis.map((emoji) {
                        final isSel = _selectedEmoji == emoji;
                        return InkWell(
                          onTap: () => setState(() => _selectedEmoji = emoji),
                          borderRadius: BorderRadius.circular(8),
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: isSel ? AppTheme.accentGreen : Colors.transparent,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: isSel ? AppTheme.accentGreen : AppTheme.darkBorder,
                              ),
                            ),
                            child: Text(emoji, style: const TextStyle(fontSize: 20)),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton(
                          onPressed: () => setState(() => _showAddFruit = false),
                          child: const Text('Hủy'),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(backgroundColor: AppTheme.accentGreen),
                          onPressed: () {
                            if (_newFruitNameCtrl.text.trim().isEmpty) return;
                            final qty = int.tryParse(_newFruitQtyCtrl.text) ?? 10;
                            setState(() {
                              _fruits.add(FruitItem(
                                id: 'f_${DateTime.now().millisecondsSinceEpoch}',
                                name: _newFruitNameCtrl.text.trim(),
                                icon: _selectedEmoji,
                                quantity: qty,
                              ));
                              _newFruitNameCtrl.clear();
                              _showAddFruit = false;
                            });
                          },
                          child: const Text('Lưu Nông Sản', style: TextStyle(color: Colors.white)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Fruits List
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _fruits.length,
            separatorBuilder: (ctx, idx) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final fruit = _fruits[index];
              return Card(
                color: isDark ? AppTheme.darkCard : AppTheme.lightCard,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: isDark ? AppTheme.darkBorder : AppTheme.lightBorder),
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  child: Row(
                    children: [
                      Text(fruit.icon, style: const TextStyle(fontSize: 26)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          fruit.name,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                      ),
                      // Controls: -10, -1, Qty, +1, +10
                      IconButton(
                        icon: const Text('-10', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                        onPressed: () => setState(() => fruit.quantity = (fruit.quantity - 10).clamp(0, 999999)),
                      ),
                      IconButton(
                        icon: const Icon(Icons.remove_circle_outline, size: 20),
                        onPressed: () => setState(() => fruit.quantity = (fruit.quantity - 1).clamp(0, 999999)),
                      ),
                      Container(
                        width: 55,
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF23252E) : Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          fruit.quantity.toString(),
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.accentGreen),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.add_circle_outline, size: 20),
                        onPressed: () => setState(() => fruit.quantity += 1),
                      ),
                      IconButton(
                        icon: const Text('+10', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                        onPressed: () => setState(() => fruit.quantity += 10),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, size: 18, color: Colors.grey),
                        onPressed: () => setState(() => _fruits.removeAt(index)),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
