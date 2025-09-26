import React, { useState } from 'react';
import { Package } from 'lucide-react';

interface ProductImageProps {
  photo?: string;
  name: string;
}

const ProductImage: React.FC<ProductImageProps> = ({ photo, name }) => {
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    setHasError(true);
  };

  if (!photo || hasError) {
    return (
      <div className="w-16 h-16 bg-dairy-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <Package className="text-dairy-600" size={24} />
      </div>
    );
  }

  return (
    <div className="w-16 h-16 bg-dairy-100 rounded-lg flex items-center justify-center flex-shrink-0">
      <img
        src={photo}
        alt={name}
        className="w-full h-full object-cover rounded-lg"
        onError={handleError}
      />
    </div>
  );
};

export default ProductImage;
