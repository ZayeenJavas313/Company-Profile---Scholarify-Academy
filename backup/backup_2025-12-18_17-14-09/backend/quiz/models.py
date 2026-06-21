# quiz/models.py
from decimal import Decimal
from django.db import models


class Subtest(models.Model):
    """
    Master subtest UTBK 2025.
    code dipakai konsisten saat impor soal (PU, PPU, PBM, PK, LBI, LBE, PM).
    """
    CODE_CHOICES = [
        ('PU', 'Penalaran Umum'),
        ('PPU', 'Pengetahuan & Pemahaman Umum'),
        ('PBM', 'Pemahaman Bacaan & Menulis'),
        ('PK', 'Pengetahuan Kuantitatif'),
        ('LBI', 'Literasi Bahasa Indonesia'),
        ('LBE', 'Literasi Bahasa Inggris'),
        ('PM', 'Penalaran Matematika'),
    ]
    code = models.CharField(max_length=4, choices=CODE_CHOICES, unique=True)
    nama_subtest = models.CharField(max_length=100)
    # pakai 1 decimal tempat (mis. 42.5)
    durasi_menit = models.DecimalField(max_digits=5, decimal_places=1)
    jumlah_soal = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.nama_subtest} ({self.code})"


class Soal(models.Model):
    """
    Bank soal per subtest.
    """
    subtest = models.ForeignKey(Subtest, on_delete=models.CASCADE, related_name='soal')
    batch = models.ForeignKey('Batch', on_delete=models.CASCADE, related_name='soal', null=True, blank=True, help_text='Batch tryout yang memiliki soal ini')
    soal_text = models.TextField()

    # Gambar soal (opsional)
    soal_image = models.ImageField(
        upload_to='soal_images/%Y/%m/%d/',
        blank=True,
        null=True,
        help_text='Gambar soal (jika soal dalam bentuk gambar)'
    )

    option_a = models.CharField(max_length=255)
    option_b = models.CharField(max_length=255)
    option_c = models.CharField(max_length=255)
    option_d = models.CharField(max_length=255)
    option_e = models.CharField(max_length=255)

    JAWAB_CHOICES = [('A', 'A'), ('B', 'B'), ('C', 'C'), ('D', 'D'), ('E', 'E')]
    correct_answer = models.CharField(max_length=1, choices=JAWAB_CHOICES, default='A')

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        batch_info = f"[{self.batch.batch_id}] " if self.batch else ""
        return f"{batch_info}[{self.subtest.code}] {self.soal_text[:60]}..."


class Batch(models.Model):
    """
    Model untuk mengelola batch tryout.
    """
    STATUS_CHOICES = [
        ('available', 'Tersedia'),
        ('locked', 'Terkunci'),
    ]
    
    batch_id = models.CharField(max_length=50, unique=True, help_text='ID batch (mis. batch-1)')
    title = models.CharField(max_length=200, help_text='Judul batch (mis. TryOut UTBK Batch 1)')
    date = models.DateField(help_text='Tanggal mulai batch tryout')
    deadline = models.DateField(help_text='Tanggal terakhir bisa mengakses batch')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='locked', help_text='Status batch')
    description = models.TextField(blank=True, null=True, help_text='Deskripsi batch (opsional)')
    is_visible = models.BooleanField(default=True, help_text='Tampilkan batch di dashboard tryout user')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = 'Batches'
        ordering = ['-date', '-created_at']
    
    def __str__(self):
        return f"{self.title} ({self.batch_id})"


class HasilTryout(models.Model):
    """
    Menyimpan hasil pengerjaan tryout per user per subtest.
    """
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='hasil_tryout')
    subtest = models.ForeignKey(Subtest, on_delete=models.CASCADE, related_name='hasil_tryout')
    batch_id = models.CharField(max_length=50, help_text="ID batch tryout (mis. batch-1)")
    
    # jawaban user: JSON format {soal_id: "A", soal_id: "B", ...}
    jawaban = models.JSONField(default=dict, help_text="Dictionary: {soal_id: jawaban_user}")
    
    # skor
    jumlah_benar = models.PositiveIntegerField(default=0)
    jumlah_salah = models.PositiveIntegerField(default=0)
    jumlah_kosong = models.PositiveIntegerField(default=0)
    skor = models.DecimalField(max_digits=5, decimal_places=2, default=0.0, help_text="Skor dalam persentase (0-100)")
    
    # metadata
    waktu_mulai = models.DateTimeField(auto_now_add=True)
    waktu_selesai = models.DateTimeField(null=True, blank=True)
    durasi_detik = models.PositiveIntegerField(null=True, blank=True, help_text="Durasi pengerjaan dalam detik")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = [['user', 'subtest', 'batch_id']]
        ordering = ['-waktu_selesai', '-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.subtest.code} (Batch: {self.batch_id}) - Skor: {self.skor}%"
    
    def hitung_skor(self):
        """Hitung ulang skor berdasarkan jawaban yang tersimpan."""
        if not self.jawaban:
            self.jumlah_benar = 0
            self.jumlah_salah = 0
            self.jumlah_kosong = 0
            self.skor = 0.0
            return
        
        # ambil soal untuk subtest ini, filter by batch jika batch_id ada
        # Ini penting untuk memastikan skor dihitung berdasarkan soal di batch yang dikerjakan
        try:
            if self.batch_id:
                batch_id_trimmed = str(self.batch_id).strip()
                soal_list = Soal.objects.filter(
                    subtest=self.subtest,
                    batch__batch_id=batch_id_trimmed
                )
                # Jika tidak ada soal dengan batch tersebut, ambil semua soal subtest
                if soal_list.count() == 0:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning(f"No soal found for batch '{batch_id_trimmed}', using all soal for subtest {self.subtest.code}")
                    soal_list = Soal.objects.filter(subtest=self.subtest)
            else:
                # Tidak ada batch_id, ambil semua soal subtest
                soal_list = Soal.objects.filter(subtest=self.subtest)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error filtering soal by batch in hitung_skor: {e}", exc_info=True)
            # Fallback: ambil semua soal subtest
        soal_list = Soal.objects.filter(subtest=self.subtest)
        
        total_soal = soal_list.count()
        
        if total_soal == 0:
            self.skor = 0.0
            return
        
        benar = 0
        salah = 0
        kosong = 0
        
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Hitung skor untuk subtest {self.subtest.code}, batch {self.batch_id}")
        logger.info(f"Total soal: {total_soal}, Total jawaban di dict: {len(self.jawaban)}")
        logger.info(f"Jawaban keys (sample): {list(self.jawaban.keys())[:10]}")
        logger.info(f"Soal IDs (sample): {[str(soal.id) for soal in soal_list[:10]]}")
        
        for soal in soal_list:
            soal_id_str = str(soal.id)
            jawaban_user_raw = self.jawaban.get(soal_id_str, "")
            jawaban_user = str(jawaban_user_raw).strip().upper() if jawaban_user_raw else ""
            
            if not jawaban_user:
                kosong += 1
                logger.debug(f"Soal {soal.id}: kosong (tidak ada di jawaban dict)")
            elif jawaban_user == soal.correct_answer:
                benar += 1
                logger.debug(f"Soal {soal.id}: BENAR (user: '{jawaban_user}', correct: '{soal.correct_answer}')")
            else:
                salah += 1
                logger.debug(f"Soal {soal.id}: SALAH (user: '{jawaban_user}', correct: '{soal.correct_answer}')")
        
        logger.info(f"Hasil perhitungan: benar={benar}, salah={salah}, kosong={kosong}")
        
        self.jumlah_benar = benar
        self.jumlah_salah = salah
        self.jumlah_kosong = kosong
        
        # skor = (benar / total) * 100
        # Pastikan skor dalam range 0-100 dengan 2 desimal
        if total_soal > 0:
            skor_raw = (benar / total_soal) * 100
            self.skor = Decimal(str(skor_raw)).quantize(Decimal('0.01'))
            # Pastikan skor tidak kurang dari 0 dan tidak lebih dari 100
            if self.skor < 0:
                self.skor = Decimal('0.00')
            elif self.skor > 100:
                self.skor = Decimal('100.00')
        else:
            self.skor = Decimal('0.00')
        
        self.save(update_fields=['jumlah_benar', 'jumlah_salah', 'jumlah_kosong', 'skor'])