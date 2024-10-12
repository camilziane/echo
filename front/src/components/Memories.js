import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, CardMedia } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';

function Memories() {
  const [memories, setMemories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:8000/memories')
      .then(response => response.json())
      .then(data => setMemories(data));
  }, []);

  const handleCardClick = (memory) => {
    navigate(`/memory/${memory.id}`, { state: { memory } });
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Memories
      </Typography>
      {memories.map((memory) => (
        <Box key={memory.id} sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' }, p: 1 }}>
          <Link to={`/memory/${memory.id}`} style={{ textDecoration: 'none' }}>
            <Card sx={{ cursor: 'pointer' }}>
              <CardMedia
                component="img"
                height="140"
                image={`data:image/png;base64,${memory.image}`}
                alt={memory.name}
              />
              <CardContent>
                <Typography gutterBottom variant="h5" component="div">
                  {memory.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {memory.location}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {memory.start_date} - {memory.end_date}
                </Typography>
              </CardContent>
            </Card>
          </Link>
        </Box>
      ))}
    </Box>
  );
}

export default Memories;
