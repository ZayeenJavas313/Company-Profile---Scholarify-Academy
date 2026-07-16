export default {
  name: 'news',
  title: 'Berita / Update',
  type: 'document',
  fields: [
    {
      name: 'judul',
      title: 'Judul Berita',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'tanggal',
      title: 'Tanggal',
      type: 'date',
      options: {
        dateFormat: 'DD MMMM YYYY',
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'ringkasan',
      title: 'Ringkasan',
      type: 'text',
      description: 'Ringkasan singkat yang muncul di card',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'isiLengkap',
      title: 'Isi Lengkap',
      type: 'blockContent',
    },
    {
      name: 'gambar',
      title: 'Gambar',
      type: 'image',
      options: {hotspot: true},
    },
    {
      name: 'urutan',
      title: 'Urutan Tampil',
      type: 'number',
      description: 'Semakin kecil angka, semakin awal tampilnya',
      initialValue: 0,
    },
  ],
  preview: {
    select: {
      title: 'judul',
      subtitle: 'tanggal',
      media: 'gambar',
    },
  },
  orderings: [
    {
      title: 'Urutan Tampil',
      name: 'urutanAsc',
      by: [{field: 'urutan', direction: 'asc'}],
    },
    {
      title: 'Tanggal Terbaru',
      name: 'tanggalDesc',
      by: [{field: 'tanggal', direction: 'desc'}],
    },
  ],
}
