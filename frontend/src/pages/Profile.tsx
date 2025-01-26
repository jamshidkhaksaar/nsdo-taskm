import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  LinkedIn as LinkedInIcon,
  GitHub as GitHubIcon,
  Twitter as TwitterIcon,
  Language as WebsiteIcon,
  PhotoCamera as PhotoCameraIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { ProfileService } from '../services/profile';

interface UserProfile {
  avatar_url: string | null;
  bio: string;
  phone_number: string;
  location: string;
  linkedin: string;
  github: string;
  twitter: string;
  website: string;
  skills: string[];
  theme_preference: string;
}

const Profile: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newSkill, setNewSkill] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await ProfileService.getProfile();
      setProfile(data);
    } catch (err) {
      setError('Failed to load profile');
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload
      try {
        const formData = new FormData();
        formData.append('avatar_base64', await convertFileToBase64(file));
        await ProfileService.updateAvatar(formData);
        setSuccess('Profile photo updated successfully');
      } catch (err) {
        setError('Failed to update profile photo');
        console.error('Error updating avatar:', err);
      }
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleProfileUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profile) return;

    try {
      await ProfileService.updateProfile(profile);
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError('Failed to update profile');
      console.error('Error updating profile:', err);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && profile) {
      setProfile({
        ...profile,
        skills: [...profile.skills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    if (profile) {
      setProfile({
        ...profile,
        skills: profile.skills.filter(skill => skill !== skillToRemove)
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      position: 'relative',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e2a78 0%, #ff3c7d 100%)',
      backgroundAttachment: 'fixed',
      backgroundSize: 'cover',
      '&::before': {
        content: '""',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Ccircle cx='20' cy='20' r='1' fill='rgba(255,255,255,0.3)'/%3E%3Cpath d='M0 20h40M20 0v40' stroke='rgba(255,255,255,0.1)' stroke-width='0.5'/%3E%3C/svg%3E")
        `,
        backgroundSize: '40px 40px',
        opacity: 0.5,
        pointerEvents: 'none',
        zIndex: 0,
      },
    }}>
      <Container 
        maxWidth="lg" 
        sx={{ 
          py: 4,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Typography variant="h4" sx={{ mb: 4, color: '#fff' }}>
          Profile Settings
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleProfileUpdate}>
          <Grid container spacing={3}>
            {/* Profile Photo Section */}
            <Grid item xs={12} md={4}>
              <Card sx={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
              }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ position: 'relative', display: 'inline-block' }}>
                    <Avatar
                      src={avatarPreview || profile?.avatar_url || undefined}
                      sx={{ width: 150, height: 150, mb: 2, mx: 'auto' }}
                    />
                    <input
                      accept="image/*"
                      type="file"
                      id="avatar-upload"
                      hidden
                      onChange={handleAvatarChange}
                    />
                    <label htmlFor="avatar-upload">
                      <IconButton
                        component="span"
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          bgcolor: 'primary.main',
                          '&:hover': { bgcolor: 'primary.dark' },
                        }}
                      >
                        <PhotoCameraIcon />
                      </IconButton>
                    </label>
                  </Box>
                  <Typography variant="h6" sx={{ color: '#fff', mt: 2 }}>
                    {user?.username}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {user?.email}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Profile Details Section */}
            <Grid item xs={12} md={8}>
              <Card sx={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
              }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        multiline
                        rows={4}
                        fullWidth
                        label="Bio"
                        value={profile?.bio || ''}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, bio: e.target.value } : null)}
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={profile?.phone_number || ''}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, phone_number: e.target.value } : null)}
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Location"
                        value={profile?.location || ''}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, location: e.target.value } : null)}
                        sx={{ mb: 2 }}
                      />
                    </Grid>

                    {/* Social Media Links */}
                    <Grid item xs={12}>
                      <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                        Social Media Links
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="LinkedIn"
                            value={profile?.linkedin || ''}
                            onChange={(e) => setProfile(prev => prev ? { ...prev, linkedin: e.target.value } : null)}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <LinkedInIcon sx={{ color: '#fff' }} />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="GitHub"
                            value={profile?.github || ''}
                            onChange={(e) => setProfile(prev => prev ? { ...prev, github: e.target.value } : null)}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <GitHubIcon sx={{ color: '#fff' }} />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Twitter"
                            value={profile?.twitter || ''}
                            onChange={(e) => setProfile(prev => prev ? { ...prev, twitter: e.target.value } : null)}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <TwitterIcon sx={{ color: '#fff' }} />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Website"
                            value={profile?.website || ''}
                            onChange={(e) => setProfile(prev => prev ? { ...prev, website: e.target.value } : null)}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <WebsiteIcon sx={{ color: '#fff' }} />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Grid>

                    {/* Skills Section */}
                    <Grid item xs={12}>
                      <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                        Skills
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <TextField
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          label="Add Skill"
                          size="small"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSkill();
                            }
                          }}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={handleAddSkill} edge="end">
                                  <AddIcon />
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {profile?.skills.map((skill) => (
                          <Chip
                            key={skill}
                            label={skill}
                            onDelete={() => handleRemoveSkill(skill)}
                            sx={{
                              bgcolor: 'rgba(255, 255, 255, 0.1)',
                              color: '#fff',
                              '& .MuiChip-deleteIcon': {
                                color: 'rgba(255, 255, 255, 0.7)',
                                '&:hover': { color: '#fff' },
                              },
                            }}
                          />
                        ))}
                      </Box>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      sx={{
                        bgcolor: 'primary.main',
                        color: '#fff',
                        '&:hover': { bgcolor: 'primary.dark' },
                      }}
                    >
                      Save Changes
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </form>
      </Container>
    </Box>
  );
};

export default Profile; 