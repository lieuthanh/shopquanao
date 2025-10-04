import { useState, useEffect } from 'react'
import axios from 'axios'

const NewsDetail = ({ articleId, onClose }) => {
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/api/news/${articleId}`)
        setArticle(response.data)
      } catch (error) {
        console.error('Error fetching article:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchArticle()
  }, [articleId])

  return (
    <div className="modal-overlay">
      <div className="modal news-detail-modal">
        <div className="modal-header">
          <h2>Chi tiết tin tức</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : article ? (
          <div className="article-detail">
            <img src={article.urlToImage} alt={article.title} />
            <h3>{article.title}</h3>
            <p>{article.description}</p>
            <div className="article-content">{article.content}</div>
            <div className="news-meta">
              <span>Tác giả: {article.author}</span>
              <span>{article.source}</span>
              <span>{new Date(article.publishedAt).toLocaleDateString('vi-VN')}</span>
            </div>
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="read-more">Đọc bài gốc</a>
          </div>
        ) : (
          <div className="error">Không tìm thấy bài viết</div>
        )}
      </div>
    </div>
  )
}

export default NewsDetail