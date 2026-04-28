import app.gee.models as gee
from app.worker import app

@app.task(bind=True, name="generate_tree_cover_tile_layer", max_retries=3)
def generate_tree_cover_tile_layer(self, chat_id: str, user_id: str, query: dict):
    try:
        bbox = query["bbox"]
        startTime = str(query["start_time"])
        endTime = str(query["end_time"])

        tile_url = gee.get_high_res_tree_cover(bbox, startTime, endTime)
        result = gee.save_query_to_db(query, chat_id, user_id, tile_url)

        return { 
            "status": "completed", 
            "data": { "id": result[0]["id"] }
        }
    except Exception as e:
        raise self.retry(exc=e, countdown=60)
    
@app.task(bind=True, name="generate_carbon_stock_tile_layer", max_retries=3)
def generate_carbon_stock_tile_layer(self, chat_id: str, user_id: str, query: dict):
    try:
        bbox = query["bbox"]
        startTime = str(query["start_time"])
        endTime = str(query["end_time"])

        tile_url = gee.get_high_res_carbon_stock(bbox, startTime, endTime)
        result = gee.save_query_to_db(query, chat_id, user_id, tile_url)

        return { 
            "status": "completed", 
            "data": { "id": result[0]["id"] }
        }
    except Exception as e:
        raise self.retry(exc=e, countdown=60)
