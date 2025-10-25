from fastapi import APIRouter
from models.post import UserPost, UserPostIn

router = APIRouter()
post_table = {}


# POST endpoint that creates a new post and returns it with the UserPost schema
@router.post("/", response_model=UserPost)
async def create_post(post: UserPostIn):
    # Convert the Pydantic model to a Python dictionary
    data = post.dict()
    # Generate a new ID based on the current number of posts in the table
    last_record_id = len(post_table)
    # Create a new post by spreading the data and adding the generated ID
    new_post = {**data, "id": last_record_id}
    # Store the new post in the dictionary using the ID as the key
    post_table[last_record_id] = new_post
    # Return the newly created post (FastAPI validates it against UserPost model)
    return new_post


@router.get("/post", response_model=list[UserPost])
async def get_posts():
    return list(post_table.values())
