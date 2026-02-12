using Microsoft.EntityFrameworkCore;
using RecommendPostService.Model;

namespace RecommendPostService.Data
{
    public class DataContext : DbContext
    {
        public DataContext(DbContextOptions<DataContext> options) : base(options)
        {
        }

        public DbSet<PostTrendingValue> PostTrendingValues { get; set; }
    }
}