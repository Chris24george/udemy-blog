const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');

const app = express();

app.use(bodyParser.json());
app.use(cors());

const posts = {};

/* example structure for posts object

posts = {
  'j123k4': {
    id: 'j123k4',
    title: 'some title',
    comments: [
      { id: 'l39v6k', content: 'comment!'},
      { id: 'a26f8u', content: 'comment 2!'}
    ]
  }
}

*/
const handleEvent = (type, data) => {
  if (type === 'PostCreated') {
    const { id, title } = data;
    posts[id] = {
      id,
      title,
      comments: []
    }
  }
  if (type === 'CommentCreated') {
    const { id, content, postId, status } = data;
    const post = posts[postId];
    post.comments.push({ id, content, status });
  }
  if (type == 'CommentUpdated') {
    const { id, postId, content, status } = data;
    const post = posts[postId];
    const comment = post.comments.find(c => {
      return c.id === id;
    });
    comment.status = status;
    comment.content = content;
  }
}


/* 
this below is receiving requests from the event-bus service
the event-bus sends over one of these two objects, which it in turn gets from the post or comment service whenever they get a post req
  {
    type: 'PostCreated',
    data: {
      id, title
    }
  }
  {
    type: 'CommentCreated',
    data: {
      id: commentId,
      content,
      postId: req.params.id
    }
  }
*/
app.post('/events', (req, res) => {
  const { type, data } = req.body;
  handleEvent(type, data);
  res.send();
})

app.get('/posts', (req, res) => {
  res.send(posts);
})

app.listen(4002, async () => {
  console.log('listening on 4002');
  try {
    const res = await axios.get('http://event-bus-srv:4005/events');
    for (let event of res.data) {
      console.log('processing event: ', event.type);
      handleEvent(event.type, event.data);
    }
  } catch (error) {
    console.log(error.message);
  }
})