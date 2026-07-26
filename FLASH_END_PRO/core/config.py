from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "FLASH-Game-Community"
    debug: bool = False

    # 数据库
    database_url: str = "mysql+aiomysql://root:123456@localhost:3306/flash_game_community"

    # JWT
    secret_key: str = "flash-game-community-secret-key-change-in-production"
    access_token_expire_minutes: int = 120
    refresh_token_expire_days: int = 30
    algorithm: str = "HS256"

    # 上传
    upload_dir: str = "uploads"
    max_image_size_mb: int = 5

    # Redis
    redis_url: str = "redis://localhost:6379/0"
    redis_password: str = ""

    # SMTP 邮箱
    smtp_host: str = "smtp.163.com"
    smtp_port: int = 465
    smtp_email: str = "wilkins_ddvd@163.com"
    smtp_password: str = ""

    # 邮箱加密密钥（AES-256, 32位）
    email_encrypt_key: str = "flash-game-email-encrypt-key-change-in-production!"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
