from decimal import Decimal
from django.core.management.base import BaseCommand
from quiz.models import Subtest


MAP = [
    # code, nama, jumlah_soal, durasi (menit) — sesuai tabel 2025
    ('PU',  'Penalaran Umum',                         30, Decimal('30.0')),
    ('PPU', 'Pengetahuan & Pemahaman Umum',          20, Decimal('15.0')),
    ('PBM', 'Pemahaman Bacaan & Menulis',            20, Decimal('25.0')),
    ('PK',  'Pengetahuan Kuantitatif',               20, Decimal('20.0')),
    ('LBI', 'Literasi Bahasa Indonesia',             30, Decimal('42.5')),
    ('LBE', 'Literasi Bahasa Inggris',               20, Decimal('20.0')),
    ('PM',  'Penalaran Matematika',                  20, Decimal('42.5')),
]


class Command(BaseCommand):
    help = "Seed master Subtest UTBK 2025"

    def handle(self, *args, **kwargs):
        created, updated = 0, 0
        for code, nama, jml, dur in MAP:
            obj, is_created = Subtest.objects.update_or_create(
                code=code,
                defaults={
                    'nama_subtest': nama,
                    'jumlah_soal': jml,
                    'durasi_menit': dur,
                }
            )
            created += is_created
            updated += (0 if is_created else 1)
        self.stdout.write(self.style.SUCCESS(
            f'Done. Subtests created: {created}, updated: {updated}'
        ))
