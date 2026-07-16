export default {
  name: 'mentor',
  title: 'Mentor',
  type: 'document',
  fields: [
    {
      name: 'nama',
      title: 'Nama',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'jabatan',
      title: 'Jabatan',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'kampus',
      title: 'Kampus / Universitas',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'logoKampus',
      title: 'Logo Kampus',
      type: 'image',
      options: {hotspot: true},
      description: 'Upload logo universitas (opsional)',
    },
    {
      name: 'foto',
      title: 'Foto',
      type: 'image',
      options: {hotspot: true},
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'kategori',
      title: 'Kategori',
      type: 'string',
      options: {
        list: [
          {title: 'Tim Inti', value: 'tim-inti'},
          {title: 'Tim Mentor', value: 'tim-mentor'},
        ],
      },
      validation: (Rule) => Rule.required(),
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
      title: 'nama',
      subtitle: 'jabatan',
      media: 'foto',
    },
  },
  orderings: [
    {
      title: 'Urutan Tampil',
      name: 'urutanAsc',
      by: [{field: 'urutan', direction: 'asc'}],
    },
  ],
}
