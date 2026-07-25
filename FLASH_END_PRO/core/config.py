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

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
