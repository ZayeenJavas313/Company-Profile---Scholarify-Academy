from django.urls import path
from . import views

app_name = 'quiz'

urlpatterns = [
    path('subtests/', views.subtests_list, name='subtests-list'),
    path('subtests/<str:code>/questions/', views.subtest_questions, name='subtest-questions'),
    path('auth/login/', views.login_view, name='api-login'),
    path('import-soal-excel/', views.import_soal_excel, name='import-soal-excel'),
    path('submit-jawaban/', views.submit_jawaban, name='submit-jawaban'),
    path('riwayat-nilai/<str:username>/', views.riwayat_nilai, name='riwayat-nilai'),
    path('batches/', views.list_batches, name='list-batches'),
    # Admin endpoints
    path('admin/dashboard/', views.admin_dashboard, name='admin-dashboard'),
    path('admin/soal/', views.admin_list_soal, name='admin-list-soal'),
    path('admin/soal/create/', views.admin_create_soal, name='admin-create-soal'),
    path('admin/soal/<int:soal_id>/update/', views.admin_update_soal, name='admin-update-soal'),
    path('admin/soal/<int:soal_id>/delete/', views.admin_delete_soal, name='admin-delete-soal'),
    path('admin/users/', views.admin_list_users, name='admin-list-users'),
    path('admin/users/create/', views.admin_create_user, name='admin-create-user'),
    path('admin/users/import-excel/', views.admin_import_users_excel, name='admin-import-users-excel'),
    path('admin/users/<int:user_id>/delete/', views.admin_delete_user, name='admin-delete-user'),
    path('admin/users/<int:user_id>/toggle-active/', views.admin_toggle_user_active, name='admin-toggle-user-active'),
    path('admin/users/<int:user_id>/reveal-password/', views.admin_reveal_password, name='admin-reveal-password'),
    path('admin/users/<int:user_id>/update-password/', views.admin_update_user_password, name='admin-update-user-password'),
    path('admin/hasil/', views.admin_list_hasil, name='admin-list-hasil'),
    path('admin/hasil/<int:hasil_id>/detail/', views.admin_detail_jawaban, name='admin-detail-jawaban'),
    # Batch management endpoints
    path('admin/batches/', views.admin_list_batches, name='admin-list-batches'),
    path('admin/batches/create/', views.admin_create_batch, name='admin-create-batch'),
    path('admin/batches/<int:batch_id>/delete/', views.admin_delete_batch, name='admin-delete-batch'),
    path('admin/batches/<int:batch_id>/', views.admin_update_batch, name='admin-update-batch'),
]




