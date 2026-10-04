const fs = require('fs');
const paths = ['./frontend/public/data/ma-nguon-mo.json', './backend/data/ma-nguon-mo.json'];

const targets = [
  "backup",
  "khôi phục",
  "kiểm tra",
  "tạo ra",
  "xem trạng thái",
  "chọn gói ngôn ngữ",
  "xem trang thông tin cá nhân",
  "xem các trang",
  "xem thông tin cá nhân của tài khoản",
  "lập thẻ đánh dấu",
  "thêm một khối",
  "Tài khoản, thêm, sửa, xóa tài khoản",
  "thêm được các khóa học, sửa khóa học, xóa khóa học",
  "xem điểm số của các học viên",
  "thiết lập lại múi giờ",
  "ngôn ngữ cho website",
  "các chính sách bảo mật cho Web",
  "hình thức trình bày của web",
  "đường dẫn hệ thống, thư điện tử, quản lý phiên làm việc",
  "lời bình, nhật ký lưu, thống kê,...",
  "chủ đề 'mục' cho khóa học đó",
  "ghi thông tin mã số của khóa học",
  "đưa thông tin tóm tắt về khóa học",
  "định dạng bài giảng theo chuẩn SCOM",
  "thiết lập dung lượng của 1 file khi upload lên hệ thống",
  "thiết lập chế độ xem báo cáo hoạt động",
  "thiết lập ngày bắt đầu khóa học"
];

paths.forEach(p => {
  if (!fs.existsSync(p)) return;
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  let modified = 0;
  
  data.questions.forEach(q => {
    if (q.image) {
      let oldQ = q.question;
      for (let t of targets) {
        if (oldQ.includes(t) && !oldQ.includes(`<b>${t}</b>`)) {
          q.question = oldQ.replace(t, `<b style="color: var(--primary-color)">${t}</b>`);
          modified++;
          break;
        }
      }
    }
  });
  
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
  console.log(`Modified ${modified} questions in ${p}`);
});
