import { useState, useEffect } from 'react'
import axios from 'axios'

const NewsAPI = ({ onClose }) => {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await axios.get('https://newsapi.org/v2/everything', {
          params: {
            q: 'fashion',
            apiKey: 'd1d199ec9ff740ca931aec05e9411639',
            pageSize: 10
          }
        })
        setArticles(response.data.articles)
      } catch (error) {
        console.error('Error fetching news:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchNews()
  }, [])

  return (
    <div className="modal-overlay">
      <div className="modal news-modal">
        <div className="modal-header">
          <h2>Tin tức thời trang (API trực tiếp)</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : (
          <div className="news-content">
            {articles.map((article, index) => (
              <div key={index} className="news-item">
                <img src={article.urlToImage} alt={article.title} />
                <div className="news-info">
                  <h3>{article.title}</h3>
                  <p>{article.description}</p>
                  <div className="news-meta">
                    <span>{article.source.name}</span>
                    <span>{new Date(article.publishedAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default NewsAPI