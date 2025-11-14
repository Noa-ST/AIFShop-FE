import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface CitySelectorProps {
  value: string;
  onChange: (city: string) => void;
  required?: boolean;
  className?: string;
  label?: string;
}

// Danh sách tỉnh/thành phố Việt Nam
const VIETNAM_CITIES = [
  'An Giang',
  'Bà Rịa - Vũng Tàu',
  'Bạc Liêu',
  'Bắc Giang',
  'Bắc Kạn',
  'Bắc Ninh',
  'Bến Tre',
  'Bình Định',
  'Bình Dương',
  'Bình Phước',
  'Bình Thuận',
  'Cà Mau',
  'Cần Thơ',
  'Cao Bằng',
  'Đà Nẵng',
  'Đắk Lắk',
  'Đắk Nông',
  'Điện Biên',
  'Đồng Nai',
  'Đồng Tháp',
  'Gia Lai',
  'Hà Giang',
  'Hà Nam',
  'Hà Nội',
  'Hà Tĩnh',
  'Hải Dương',
  'Hải Phòng',
  'Hậu Giang',
  'Hòa Bình',
  'Hưng Yên',
  'Khánh Hòa',
  'Kiên Giang',
  'Kon Tum',
  'Lai Châu',
  'Lâm Đồng',
  'Lạng Sơn',
  'Lào Cai',
  'Long An',
  'Nam Định',
  'Nghệ An',
  'Ninh Bình',
  'Ninh Thuận',
  'Phú Thọ',
  'Phú Yên',
  'Quảng Bình',
  'Quảng Nam',
  'Quảng Ngãi',
  'Quảng Ninh',
  'Quảng Trị',
  'Sóc Trăng',
  'Sơn La',
  'Tây Ninh',
  'Thái Bình',
  'Thái Nguyên',
  'Thanh Hóa',
  'Thừa Thiên Huế',
  'Tiền Giang',
  'TP. Hồ Chí Minh',
  'Trà Vinh',
  'Tuyên Quang',
  'Vĩnh Long',
  'Vĩnh Phúc',
  'Yên Bái',
];

export default function CitySelector({ 
  value, 
  onChange, 
  required = false,
  className,
  label 
}: CitySelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredCities = VIETNAM_CITIES.filter(city =>
    city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
  };

  const handleSelectCity = (city: string) => {
    onChange(city);
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div className={cn("city-selector relative", className)}>
      {label && (
        <Label htmlFor="city-input" className="mb-2 block">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Input
          id="city-input"
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder="Chọn hoặc nhập tỉnh/thành phố"
          required={required}
          list="cities-datalist"
          className="w-full"
        />
        
        <datalist id="cities-datalist">
          {VIETNAM_CITIES.map(city => (
            <option key={city} value={city} />
          ))}
        </datalist>

        {isOpen && filteredCities.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredCities.map(city => (
              <div
                key={city}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectCity(city);
                }}
              >
                {city}
              </div>
            ))}
          </div>
        )}

        {isOpen && filteredCities.length === 0 && searchTerm && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
            <div className="px-4 py-2 text-gray-500">
              Không tìm thấy tỉnh/thành phố
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

