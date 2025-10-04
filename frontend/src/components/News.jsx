import { useState, useEffect } from 'react'
import axios from 'axios'
import NewsDetail from './NewsDetail'

const News = ({ onClose }) => {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedArticleId, setSelectedArticleId] = useState(null)

  const fetchNews = async (currentPage = 1) => {
    setLoading(true)
    try {
      const response = await axios.get(`http://localhost:3001/api/news?page=${currentPage}&limit=5`)
      setArticles(response.data.articles)
      setTotalPages(response.data.totalPages || 1)
    } catch (error) {
      console.error('Error fetching news:', error)
    } finally {
      setLoading(false)
    }
  }



  useEffect(() => {
    fetchNews(page)
  }, [page])

  return (
    <div className="modal-overlay">
      <div className="modal news-modal">
        <div className="modal-header">
          <h2>Tin tức thời trang</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : (
          <>
            <div className="news-content">
              {articles.map((article, index) => (
                <div key={article.id || index} className="news-item" onClick={() => setSelectedArticleId(article.id || `fallback_${index + 1}`)}>
                  <img src={article.urlToImage} alt={article.title} />
                  <div className="news-info">
                    <h3>{article.title}</h3>
                    <p>{article.description}</p>
                    <div className="news-meta">
                      <span>{article.source}</span>
                      <span>{new Date(article.publishedAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="pagination">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
              >
                Trước
              </button>
              <span>Trang {page} / {totalPages}</span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages}
              >
                Sau
              </button>
            </div>
          </>
        )}
        {selectedArticleId && (
          <NewsDetail
            articleId={selectedArticleId}
            onClose={() => setSelectedArticleId(null)}
          />
        )}
      </div>
    </div>
  )
}

export default News