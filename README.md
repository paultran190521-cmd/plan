# PlanFlow 🚀

**Ứng dụng lập kế hoạch và theo dõi tiến độ dự án hiện đại**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Click%20Here-1992b0?style=for-the-badge)](https://yourusername.github.io/planflow)
![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

---

## ✨ Tính Năng

### 📊 Dashboard Tổng Quan
- Thống kê số lượng dự án, nhiệm vụ theo thời gian thực
- **Biểu đồ donut** tiến độ tổng thể (Đang làm / Chờ xử lý / Hoàn thành)
- Danh sách dự án gần đây với thanh tiến độ mini
- **Cảnh báo deadline** thông minh: quá hạn / sắp hết hạn / bình thường

### 📁 Quản Lý Dự Án
- Tạo, chỉnh sửa, xóa dự án
- Tùy chỉnh màu sắc cho từng dự án
- Thanh tiến độ tự động tính toán từ các nhiệm vụ
- Xem nhanh số nhiệm vụ và deadline

### 🗂️ Kanban Board
- **Kéo & thả** nhiệm vụ giữa các cột
- 4 cột: Cần Làm → Đang Làm → Đánh Giá → Hoàn Thành
- Lọc theo dự án
- Hiển thị thanh tiến độ, mức độ ưu tiên và deadline trực quan

### 📅 Timeline / Gantt Chart
- Hiển thị timeline cho từng dự án
- **Đường kẻ "Hôm nay"** giúp xác định tiến độ so với thực tế
- Màu sắc theo trạng thái nhiệm vụ
- Zoom tự động theo khoảng thời gian dự án

### ✅ Quản Lý Nhiệm Vụ
- Bảng đầy đủ với **tìm kiếm + bộ lọc** (trạng thái, mức độ ưu tiên)
- Thanh tiến độ inline cho từng nhiệm vụ
- Cảnh báo deadline quá hạn bằng màu đỏ

---

## 🎨 Design System

| Thuộc tính | Giá trị |
|---|---|
| Font chữ | **Quicksand** (Google Fonts) |
| Màu chính | `#1992b0` (Teal) |
| Màu nhấn | `#ff9500` (Orange) |
| Giao diện | Dark mode |
| Framework | Vanilla HTML/CSS/JS (không phụ thuộc) |

---

## 🚀 Triển Khai lên GitHub Pages

### Bước 1: Tạo Repository
```bash
git init
git add .
git commit -m "feat: initial PlanFlow app"
```

### Bước 2: Đẩy lên GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/planflow.git
git branch -M main
git push -u origin main
```

### Bước 3: Bật GitHub Pages
1. Vào **Settings** của repository
2. Chọn **Pages** ở menu bên trái
3. Source: chọn **Deploy from a branch** → Branch: `main` → Folder: `/ (root)`
4. Nhấn **Save**

Sau \~1 phút, app sẽ live tại: `https://YOUR_USERNAME.github.io/planflow`

---

## 💾 Lưu Trữ Dữ Liệu

Ứng dụng sử dụng **localStorage** của trình duyệt, dữ liệu được lưu ngay trên thiết bị của bạn — không cần server, không cần đăng nhập.

---

## 📌 Cấu Trúc Thư Mục

```
planflow/
├── index.html    # Cấu trúc HTML chính
├── style.css     # Toàn bộ CSS (Design System)
├── app.js        # Logic ứng dụng
└── README.md     # Tài liệu hướng dẫn
```

---

## 🛠️ Phát Triển Cục Bộ

Chỉ cần mở file `index.html` trực tiếp trên trình duyệt — không cần server hay cài đặt gì thêm!

---

Made with ❤️ by PlanFlow
