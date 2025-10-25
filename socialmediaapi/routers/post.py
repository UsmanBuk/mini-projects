from fastapi import APIRouter, HTTPException
from models.post import Comment, CommentIn, UserPost, UserPostIn, UserPostWithComments

router = APIRouter()
post_table = {}
comment_table = {}


def find_post(post_id: int):
    return post_table.get(post_id)


# POST endpoint that creates a new post and returns it with the UserPost schema
@router.post("/post", response_model=UserPost, status_code=201)
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


# POST endpoint that creates a new comment and returns it with the Comment schema
@router.post("/comment", response_model=Comment)
async def create_comment(comment: CommentIn):
    post = find_post(comment.post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    data = comment.dict()
    last_record_id = len(comment_table)
    new_comment = {**data, "id": last_record_id}
    comment_table[last_record_id] = new_comment
    return new_comment


@router.get("/post/{post_id}/comment", response_model=list[Comment])
async def get_comments(post_id: int):
    post = find_post(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return [
        comment for comment in comment_table.values() if comment["post_id"] == post_id
    ]


@router.get("/post/{post_id}", response_model=UserPostWithComments)
async def get_post_with_comments(post_id: int):
    post = find_post(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return {
        "post": post,
        "comments": [
            comment
            for comment in comment_table.values()
            if comment["post_id"] == post_id
        ],
    }
