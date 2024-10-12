import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, ImageList, ImageListItem } from '@mui/material';
import { useParams } from 'react-router-dom';

function Memory() {
    const { id } = useParams();
    const [memory, setMemory] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`http://localhost:8000/memories/${id}`)
            .then(response => response.json())
            .then(data => {
                setMemory(data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching memory:', error);
                setLoading(false);
            });
    }, [id]);

    if (loading) return <Box display="flex" justifyContent="center"><CircularProgress /></Box>;
    if (!memory) return <Typography>Memory not found.</Typography>;

    return (
        <Paper elevation={3} sx={{ maxWidth: 800, margin: 'auto', padding: 3 }}>
            <Typography variant="h4" gutterBottom>{memory.name}</Typography>
            <Typography paragraph>{memory.texts}</Typography>
            
            {memory.images && memory.images.length > 0 && (
                <Box sx={{ marginTop: 2 }}>
                    <Typography variant="h6" gutterBottom>Images</Typography>
                    <ImageList sx={{ width: '100%', height: 'auto' }} cols={3} rowHeight={164}>
                        {memory.images.map((img, index) => (
                            <ImageListItem key={index}>
                                <img
                                    src={`data:image/jpeg;base64,${img}`}
                                    alt={`Memory image ${index + 1}`}
                                    loading="lazy"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </ImageListItem>
                        ))}
                    </ImageList>
                </Box>
            )}
        </Paper>
    );
}

export default Memory;
