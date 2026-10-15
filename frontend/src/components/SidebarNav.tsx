import React from 'react';
import { 
  BookOpen, 
  GraduationCap, 
  RotateCcw, 
  Plus, 
  RefreshCw, 
  Moon, 
  Sun, 
  Home, 
  Menu
} from 'lucide-react';

interface SidebarNavProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
  currentPage: string;
  activeTab: 'materials' | 'english';
  hasProgress?: boolean;
  onNavigate: (page: string, params?: any) => void;
  onTabChange: (tab: 'materials' | 'english') => void;
  currentTheme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  isExpanded,
  onToggleExpand,
  currentPage,
  activeTab,
  hasProgress,
  onNavigate,
  onTabChange,
  currentTheme,
  onToggleTheme
}) => {
  const handleItemClick = (fn: () => void) => {
    fn();
    if (window.innerWidth <= 768 && isExpanded) {
      onToggleExpand();
    }
  };

  const navGroups = [
    {
      title: 'Học tập & Ôn thi',
      items: [
        {
          id: 'quiz',
          label: 'Ôn tập Quiz',
          desc: 'Luyện đề trắc nghiệm lập trình & thi thử',
          icon: BookOpen,
          isActive: currentPage === 'dashboard' && activeTab === 'materials',
          onClick: () => handleItemClick(() => {
            onTabChange('materials');
            if (currentPage !== 'dashboard') onNavigate('dashboard');
          })
        },
        {
          id: 'english',
          label: 'Tài liệu Tiếng Anh',
          desc: 'Ngữ pháp, từ vựng & bài đọc hiểu',
          icon: GraduationCap,
          isActive: currentPage === 'dashboard' && activeTab === 'english',
          onClick: () => handleItemClick(() => {
            onTabChange('english');
            if (currentPage !== 'dashboard') onNavigate('dashboard');
          })
        },
        {
          id: 'progress',
          label: 'Bài đang làm',
          desc: 'Tiếp tục bài làm đã lưu tạm',
          icon: RotateCcw,
          badge: hasProgress ? 'Có bài' : undefined,
          isActive: false,
          onClick: () => handleItemClick(() => {
            if (currentPage !== 'dashboard') {
              onNavigate('dashboard');
              setTimeout(() => {
                const el = document.getElementById('in-progress-section');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 120);
            } else {
              const el = document.getElementById('in-progress-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }
          })
        }
      ]
    },
    {
      title: 'Quản lý bộ đề',
      items: [
        {
          id: 'import',
          label: 'Thêm bộ đề mới',
          desc: 'Nạp tệp JSON câu hỏi hoặc bài học',
          icon: Plus,
          isActive: currentPage === 'import',
          onClick: () => handleItemClick(() => onNavigate('import'))
        },
        {
          id: 'update',
          label: 'Update',
          desc: 'Đồng bộ & làm mới hệ thống',
          icon: RefreshCw,
          isActive: false,
          onClick: () => handleItemClick(() => {
            if (currentPage === 'taking' || currentPage === 'review') {
              window.dispatchEvent(new CustomEvent('global-update'));
            } else {
              window.location.reload();
            }
          })
        }
      ]
    },
    {
      title: 'Hệ thống',
      items: [
        {
          id: 'home',
          label: 'Về trang chủ',
          desc: 'Quay lại danh sách bộ đề chính',
          icon: Home,
          isActive: false,
          onClick: () => handleItemClick(() => {
            onTabChange('materials');
            if (currentPage !== 'dashboard') onNavigate('dashboard');
          })
        },
        {
          id: 'theme',
          label: currentTheme === 'light' ? 'Chế độ Tối' : 'Chế độ Sáng',
          desc: currentTheme === 'light' ? 'Chuyển sang nền tối dịu mắt' : 'Chuyển sang nền sáng tiêu chuẩn',
          icon: currentTheme === 'light' ? Moon : Sun,
          isActive: false,
          onClick: () => handleItemClick(() => {
            onToggleTheme();
          })
        }
      ]
    }
  ];

  return (
    <>
      {/* Backdrop overlay khi mở rộng trên màn hình nhỏ hoặc click ngoài */}
      <div 
        className={`mega-sidebar-backdrop ${isExpanded ? 'active' : ''}`}
        onClick={onToggleExpand}
        aria-hidden="true"
      />

      <aside 
        className={`mega-sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}
        aria-label="Thanh điều hướng Mega Nav"
      >
        {/* Header của thanh Mega Nav: Logo Quiz Local & Nút Menu */}
        <div className="mega-sidebar-header">
          <div 
            className="mega-sidebar-brand"
            onClick={() => { if (currentPage !== 'dashboard') onNavigate('dashboard'); }}
            title="Quiz Local - Về trang chủ"
          >
            <span className="brand-title">Quiz Local</span>
          </div>

          <div className="mega-sidebar-menu-wrapper">
            <button 
              className="mega-sidebar-menu-btn"
              onClick={onToggleExpand}
              title={isExpanded ? "Thu gọn menu" : "Mở rộng menu"}
              aria-label={isExpanded ? "Thu gọn menu" : "Mở rộng menu"}
            >
              <Menu size={20} />
            </button>

            {!isExpanded && (
              <div className="mega-sidebar-mini-tooltip">
                <span>Quiz Local • Mở menu</span>
              </div>
            )}
          </div>
        </div>

        {/* Danh sách các nhóm và mục điều hướng */}
        <div className="mega-sidebar-content">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="mega-sidebar-group">
              <div className="mega-sidebar-group-title">{group.title}</div>
              <div className="mega-sidebar-group-divider" />

              <div className="mega-sidebar-items">
                {group.items.map(item => {
                  const IconComp = item.icon;
                  return (
                    <div key={item.id} className="mega-sidebar-item-wrapper">
                      <button
                        className={`mega-sidebar-item ${item.isActive ? 'active' : ''}`}
                        onClick={item.onClick}
                      >
                        <IconComp size={19} className="item-icon" />
                        <span className="item-label">{item.label}</span>
                        {item.badge && (
                          <span className="item-badge">{item.badge}</span>
                        )}
                      </button>

                      {/* Phần Pop ngắn gọn khi hover từng icon ở thanh thu nhỏ */}
                      {!isExpanded && (
                        <div className="mega-sidebar-pop-box">
                          <div className="pop-box-arrow" />
                          <div className="pop-box-header">
                            <IconComp size={15} className="pop-box-header-icon" />
                            <span className="pop-box-title">{item.label}</span>
                            {item.isActive && (
                              <span className="pop-box-badge-active">Đang mở</span>
                            )}
                            {item.badge && (
                              <span className="pop-box-badge-info">{item.badge}</span>
                            )}
                          </div>
                          <p className="pop-box-desc">{item.desc}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
};

export default SidebarNav;
