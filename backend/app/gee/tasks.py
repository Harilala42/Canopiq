import app.gee.models as gee
from app.worker import app

@app.task(bind=True, name="generate_tree_cover_tile_layer", max_retries=3)
def task_generate_tree_cover_tile_layer(self, chat_id: str, user_id: str, query: dict):
    try:
        bbox = query["bbox"]
        startTime = str(query["start_time"])
        endTime = str(query["end_time"])

        tile_url = gee.compute_tree_cover_tl(bbox, startTime, endTime)
        result = gee.save_query_to_db(query, chat_id, user_id, tile_url)

        return { 
            "status": "completed", 
            "data": { 
                "id": f"tree_cover_tl_{chat_id}",
                "data": result
            }
        }
    except Exception as e:
        raise self.retry(exc=e, countdown=60)
    
@app.task(bind=True, name="generate_tree_cover_time_series", max_retries=3)
def task_generate_tree_cover_time_series(self, chat_id: str, user_id: str, query: dict):
    try:
        bbox = query["bbox"]
        startTime = str(query["start_time"])
        endTime = str(query["end_time"])

        result = gee.compute_tree_cover_ts(bbox, startTime, endTime)

        return { 
            "status": "completed", 
            "data": { 
                "id": f"tree_cover_ts_{chat_id}",
                "data": result
            }
        }
    except Exception as e:
        raise self.retry(exc=e, countdown=60)
    
@app.task(bind=True, name="generate_carbon_stock_tile_layer", max_retries=3)
def task_generate_carbon_stock_tile_layer(self, chat_id: str, user_id: str, query: dict):
    try:
        bbox = query["bbox"]
        startTime = str(query["start_time"])
        endTime = str(query["end_time"])

        tile_url = gee.compute_carbon_stock_tl(bbox, startTime, endTime)
        result = gee.save_query_to_db(query, chat_id, user_id, tile_url)

        return { 
            "status": "completed", 
            "data": { 
                "id": f"carbon_stock_tl_{chat_id}",
                "data": result
            }
        }
    except Exception as e:
        raise self.retry(exc=e, countdown=60)
    
@app.task(bind=True, name="generate_carbon_stock_time_series", max_retries=3)
def task_generate_carbon_stock_time_series(self, chat_id: str, user_id: str, query: dict):
    try:
        bbox = query["bbox"]
        startTime = str(query["start_time"])
        endTime = str(query["end_time"])

        result = gee.compute_carbon_stock_ts(bbox, startTime, endTime)

        return { 
            "status": "completed", 
            "data": { 
                "id": f"carbon_stock_ts_{chat_id}",
                "data": result
            }
        }
    except Exception as e:
        raise self.retry(exc=e, countdown=60)
