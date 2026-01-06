cd ~/htdocs/scooter-rental.ai-tracks.com
git pull
php artisan r:cache
php artisan config:cache
cd ~/htdocs/scooter-rental.ai-tracks.com/system/backend
pnpm build
cd ~/htdocs/scooter-rental.ai-tracks.com/system/frontend
pnpm build
