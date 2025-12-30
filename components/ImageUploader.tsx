
import React, { useRef } from 'react';

interface ImageUploaderProps {
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ images, setImages }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Fixed: Cast the array from FileList to File[] to ensure correct type inference for 'file'
    const files = Array.from(e.target.files || []) as File[];
    if (images.length + files.length > 4) {
      alert("Max 4 images allowed");
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      // Fixed: 'file' is now correctly typed as File (which extends Blob)
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map((src, idx) => (
          <div key={idx} className="relative aspect-[3/4] bg-neutral-100 rounded-2xl overflow-hidden group">
            <img src={src} className="w-full h-full object-cover" alt={`Upload ${idx}`} />
            <button 
              onClick={() => removeImage(idx)}
              className="absolute top-2 right-2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        {images.length < 4 && (
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="aspect-[3/4] border-2 border-dashed border-neutral-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-black hover:bg-neutral-50 transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-xs font-medium uppercase tracking-widest text-neutral-400 group-hover:text-black">Add Piece</span>
          </button>
        )}
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        multiple 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
};

export default ImageUploader;
