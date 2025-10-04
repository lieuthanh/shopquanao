import { useState } from 'react'
import axios from 'axios'
import CryptoJS from 'crypto-js'

const ImageUpload = ({ onImageUploaded }) => {
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setUploading(true)

    try {
      // Đọc file thành base64
      const reader = new FileReader()
      
      reader.onload = async () => {
        try {
          const base64 = reader.result.split(',')[1] // Bỏ phần "data:image/...;base64,"
          
          // Tính MD5 checksum từ base64
          const checksum = CryptoJS.MD5(CryptoJS.enc.Base64.parse(base64)).toString()

          console.log('📦 File converted to base64, checksum:', checksum)

          // Upload base64 lên server
          const response = await axios.post('http://localhost:3001/api/upload/from-base64', {
            base64,
            checksum,
            filename: file.name,
            mimetype: file.type
          })

          console.log('✅ Upload successful:', response.data)
          onImageUploaded(response.data.imageUrl)
        } catch (error) {
          console.error('Base64 upload error:', error)
          alert('Lỗi upload hình ảnh: ' + (error.response?.data?.message || error.message))
        } finally {
          setUploading(false)
        }
      }

      reader.onerror = () => {
        console.error('File read error')
        alert('Lỗi đọc file')
        setUploading(false)
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Lỗi upload hình ảnh')
      setUploading(false)
    }
  }

  return (
    <div className="image-upload">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        disabled={uploading}
      />
      {uploading && <span>Đang upload...</span>}
    </div>
  )
}

export default ImageUpload