"""
Django management command untuk memindahkan semua soal yang ada ke batch-1.
Jika batch-1 belum ada, command ini akan membuatnya terlebih dahulu.
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
from quiz.models import Soal, Batch


class Command(BaseCommand):
    help = 'Memindahkan semua soal yang ada ke batch-1. Jika batch-1 belum ada, akan dibuat.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--create-batch',
            action='store_true',
            help='Buat batch-1 jika belum ada',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Pindahkan SEMUA soal ke batch-1 (termasuk yang sudah punya batch)',
        )

    def handle(self, *args, **options):
        # Cek apakah batch-1 sudah ada
        try:
            batch_1 = Batch.objects.get(batch_id='batch-1')
            self.stdout.write(self.style.SUCCESS(f'Batch-1 ditemukan: {batch_1.title}'))
        except Batch.DoesNotExist:
            if options['create_batch']:
                # Buat batch-1
                today = date.today()
                batch_1 = Batch.objects.create(
                    batch_id='batch-1',
                    title='TryOut SNBT Batch 1',
                    date=today,
                    deadline=today + timedelta(days=7),
                    status='available',
                    description='Batch tryout pertama',
                    is_visible=True,
                )
                self.stdout.write(self.style.SUCCESS(f'Batch-1 berhasil dibuat: {batch_1.title}'))
            else:
                self.stdout.write(
                    self.style.ERROR(
                        'Batch-1 tidak ditemukan. Gunakan --create-batch untuk membuatnya otomatis.'
                    )
                )
                return

        # Ambil soal berdasarkan opsi
        if options['all']:
            # Pindahkan SEMUA soal ke batch-1
            semua_soal = Soal.objects.all()
            total_soal = semua_soal.count()
            self.stdout.write(self.style.WARNING(f'Memindahkan SEMUA {total_soal} soal ke batch-1...'))
            updated = semua_soal.update(batch=batch_1)
        else:
            # Hanya pindahkan soal yang belum punya batch
            soal_tanpa_batch = Soal.objects.filter(batch__isnull=True)
            total_soal = soal_tanpa_batch.count()
            
            if total_soal == 0:
                self.stdout.write(self.style.WARNING('Tidak ada soal yang perlu dipindahkan. Gunakan --all untuk memindahkan semua soal.'))
                return

            self.stdout.write(f'Memindahkan {total_soal} soal (yang belum punya batch) ke batch-1...')
            updated = soal_tanpa_batch.update(batch=batch_1)

        self.stdout.write(
            self.style.SUCCESS(
                f'Berhasil memindahkan {updated} soal ke batch-1 ({batch_1.batch_id})'
            )
        )

        # Tampilkan ringkasan per subtest
        soal_di_batch1 = Soal.objects.filter(batch=batch_1).select_related('subtest')
        subtest_counts = {}
        for soal in soal_di_batch1:
            code = soal.subtest.code
            subtest_counts[code] = subtest_counts.get(code, 0) + 1

        self.stdout.write('\nRingkasan soal di batch-1:')
        for code, count in sorted(subtest_counts.items()):
            self.stdout.write(f'  - {code}: {count} soal')

