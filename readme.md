
# The Blog Project (Backend & Frontend)

- Author: [Hoàng Tùng](https://tungth.com) (same as [TrHgTung](https://github.com/TrHgTung))

- [View the Security checklist case study](https://blogsocial.io.vn/post/security-checklist-for-web-development)

## Development / Test Environment:

### 1. Prerequisites
- Ensure a MySQL DBMS is running (I'm gonna use MySQL via Laragon).
- Database `socialproject` should exist - if not, create one (Migration scripts have already been applied to this shit, so make sure the db name is exactly `socialproject`).

### 2. Build for the first time

1. Open Laragon > Start MySQL service > create a database, name: `socialproject` and save it

2. Open Command Prompt > check once again if you're stil at the root directory of the source code > type init-project-for-the-first-time.ps1 and hit Enter.

3. Wait for these shit building (backend, migrating, frontend, bla bla..)

4. Back to the Command Prompt > check once again if you're stil at the root directory of the source code > type dev-start.ps1 and hit Enter.

5. The API now will be available at `https://localhost:5001`.

6. Open your browser and navigate to `http://localhost:3000`. Because the front-end is on it.

7. Test yourself!

> If your operation system can't run the ps1 script file? Nah, just use Windows and try again!

## Production:

1. Prepare a VPS, a domain name and your money for purchasing these shit

2. Suggested VPS configuration: 2GB of RAM, >20GB of storage, running Ubuntu or other Linux distro

3. Setup your VPS

4. Start VPS, or use SSH to connect from your PC > login > sudo su > apt update > apt install docker (Google search for more instructions about setting up Git, Docker, Docker Image, ..)

5. `Git clone` the source code for the first time or `git pull` the source code for updating > `cd` to the source > and then

    5.1. Add `touch docker-compose.yml` file to the root directory of project, and config it by yourself (`nano docker-compose.yml` > Save and overwrite file.
    
     > **REMEMBER**: enviroment variables in docker-compose.yml file will work on Docker VPS, not on your PC. On your PC, you can use `dev-start.ps1` script file instead (it will use appsettings.Development.json and .env files)

    5.2. Add new wwwroot folder on backend source: `cd backend` > `mkdir wwwroot` > hit Enter

    5.3. Add appsettings.Development.json file on backend source: `cd backend` > `touch appsettings.Development.json` > `nano appsettings.Development.json` > Add all necessary environment variables (Check the appsettings.Development.example.json) > Save file

    5.4. Add .env file for frontend source: `cd frontend` > `touch .env` > `nano .env` > Add all necessary environment variables (Check the .env.example) > save file

    5.5. Back to root directory of the source (`cd ..`) > Run `docker compose up -d --build` for building all the images

> Or just create a GitHub Actions workflow (.github/workflows/deploy.yml) [Example file](./example-deploy.yml)

# VPS Maintenance & Deployment Cheatsheet

## 1. Truy cập dự án
Mọi câu lệnh Docker Compose đều phải được thực hiện trong thư mục gốc của dự án:
```bash
cd /root/The-Blog-Project
```

---

## 2. Xem Log (Kiểm tra lỗi)
Đây là cách nhanh nhất để biết tại sao ứng dụng không chạy hoặc bị lỗi.

*   **Xem tất cả log (Real-time):**
    ```bash
    docker compose logs -f
    ```
*   **Chỉ xem Backend (.NET Core):**
    ```bash
    docker compose logs -f backend
    ```
*   **Chỉ xem Frontend (Next.js):**
    ```bash
    docker compose logs -f frontend
    ```
*   **Xem 100 dòng cuối cùng của Backend:**
    ```bash
    docker compose logs -f --tail 100 backend
    ```

---

## 3. Cập nhật Code mới (Deploy thủ công)
Bình thường Github Actions sẽ tự làm, nhưng nếu muốn chạy tay:
```bash
# 1. Kéo code mới
git pull origin main

# 2. Rebuild và chạy lại
docker compose down --remove-orphans
docker compose up -d --build

# 3. Dọn dẹp rác (giúp tiết kiệm RAM/Disk cho VPS yếu)
docker system prune -f
```

---

## 4. Quản lý Database (MySQL)
Dự án dùng container `social-mysql0234`.

*   **Truy cập vào MySQL Command Line:**
    ```bash
    docker exec -it social-mysql0234 mysql -u root -p
    # Nhập password (lấy từ file docker-compose.yml)
    ```
*   **Backup database:**
    ```bash
    docker exec social-mysql0234 /usr/bin/mysqldump -u root --password=*************** socialproject > backup.sql
    ```
> Hoặc tunnel bằng Laragon HeidiSQL
---

## 5. Các lệnh Docker hữu ích khác
*   **Kiểm tra trạng thái các container:**
    ```bash
    docker ps
    ```
    hoặc `docker ps -q`
*   **Kiểm tra tài nguyên đang sử dụng (RAM/CPU):**
    ```bash
    docker stats
    htop
    ```
*   **Khởi động lại một service cụ thể (không downtime service khác):**
    ```bash
    docker compose restart backend
    ```
* **Buộc dừng:**
    ```bash
    docker stop {id-container}
    ```
    hoặc dừng toàn bộ:
    ```bash
    docker stop $(docker ps -q)
    ```
---

## 6. Lưu ý quan trọng
*   **Caddy:** Lưu trữ chứng chỉ SSL tại volume `caddy_data`. Đừng xóa volume này trừ khi muốn reset SSL.
*   **Uploads:** Ảnh người dùng upload được lưu tại `./backend/wwwroot/uploads` trên VPS và mount vào container. Hãy cẩn thận khi xóa thư mục này.

---

> Liên hệ [với tôi](https://tungth.com/#home-about-social-el) để được cung cấp ${full source} hoặc plan tùy biến thêm, cùng với hướng dẫn chi tiết hơn nữa.