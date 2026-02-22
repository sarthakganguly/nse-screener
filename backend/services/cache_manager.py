import redis
import json
import os
from .logger import Logger

class CacheManager:
    def __init__(self):
        self.redis_host = os.getenv("REDIS_HOST", "redis")
        self.client = redis.Redis(
            host=self.redis_host, 
            port=6379, 
            decode_responses=True
        )

    def get(self, key):
        data = self.client.get(key)
        if data:
            return json.loads(data)
        return None

    def set(self, key, value, expire=None):
        try:
            serialized = json.dumps(value)
            if expire:
                self.client.setex(key, expire, serialized)
            else:
                self.client.set(key, serialized)
        except Exception as e:
            Logger.error(f"Redis Set Error for {key}", str(e))

# Singleton instance
cache = CacheManager()