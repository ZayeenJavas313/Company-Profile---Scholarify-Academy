export default {
  name: 'testimonial',
  title: 'Testimoni',
  type: 'document',
  fields: [
    {
      name: 'nama',
      title: 'Nama',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'asalKampus',
      title: 'Asal Kampus / Universitas',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'isi',
      title: 'Isi Testimoni',
      type: 'text',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'rating',
      title: 'Rating (1-5)',
      type: 'number',
      options: {
        list: [
          {title: '1 Bintang', value: 1},
          {title: '2 Bintang', value: 2},
          {title: '3 Bintang', value: 3},
          {title: '4 Bintang', value: 4},
          {title: '5 Bintang', value: 5},
        ],
      },
      validation: (Rule) => Rule.required().min(1).max(5),
    },
    {
      name: 'foto',
      title: 'Foto',
      type: 'image',
      options: {hotspot: true},
    },
  ],
  preview: {
    select: {
      title: 'nama',
      subtitle: 'asalKampus',
      media: 'foto',
    },
  },
}
