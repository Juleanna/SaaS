from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView, UserRegistrationView, UserProfileView,
    UserUpdateView, change_password, login_view, user_info, upload_avatar,
    top_up_balance
)

urlpatterns = [
    # JWT Authentication
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User management
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', login_view, name='login'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('update/', UserUpdateView.as_view(), name='update_profile'),
    path('change-password/', change_password, name='change_password'),
    path('user-info/', user_info, name='user_info'),
    path('upload-avatar/', upload_avatar, name='upload_avatar'),
    path('top-up-balance/', top_up_balance, name='top_up_balance'),
] 