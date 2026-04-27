import app.gee.models as gee
from app.llm.schemas import GeoSpatialQuery
from app.worker import app

@app.task(bind=True, name="generate_tree_cover_tile_layer", max_retries=3)
def generate_tree_cover_tile_layer(self, chat_id: str, query: GeoSpatialQuery):
    try:
        bbox = query.bbox
        startTime = str(query.start_time)
        endTime = str(query.end_time)

        result = gee.get_high_res_tree_cover(bbox, startTime, endTime)

        return { 
            "status": "completed", 
            "data": { 
                "id": chat_id,
                "tile_url": result
            }
        }
    except Exception as e:
        raise self.retry(exc=e, countdown=2)
    
@app.task(bind=True, name="generate_carbon_stock_tile_layer", max_retries=3)
def generate_carbon_stock_tile_layer(self, chat_id: str, query: GeoSpatialQuery):
    try:
        bbox = query.bbox
        startTime = str(query.start_time)
        endTime = str(query.end_time)

        result = gee.get_high_res_carbon_stock(bbox, startTime, endTime)

        return { 
            "status": "completed", 
            "data": { 
                "id": chat_id,
                "query": result
            }
        }
    except Exception as e:
        raise self.retry(exc=e, countdown=2)
