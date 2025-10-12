window.PUBLISHING_TAB_CONTENT = {
  publishing: {
    title: 'Publishing House',
    body: [
      'Celebrate your publishing heritage with a concise mission statement that speaks to your editorial vision and the authors you champion.',
      'Share recent milestones such as award-winning releases, international rights deals, or community initiatives that distinguish your house.',
      {
        type: 'list',
        items: [
          'Core genres: literary fiction, narrative nonfiction, children\'s literature',
          'Flagship imprints focused on debut voices and translated works',
          'Collaborations with cultural institutions and festival partners'
        ]
      }
    ]
  },
  authors: {
    title: 'For Authors',
    body: [
      'Outline how prospective authors can submit manuscripts, including response timelines and what to expect after hitting send.',
      'Explain the editorial partnership — from developmental edits to cover design — that helps storytellers feel supported at every step.',
      {
        type: 'list',
        items: [
          'Downloadable submission checklist',
          'Monthly virtual pitch sessions hosted by senior editors',
          'Author mentorship program pairing debut writers with alumni'
        ]
      }
    ]
  },
  selfPublishing: {
    title: 'Self-publishing',
    body: [
      'Empower independent creators with transparent packages that combine print-on-demand, distribution, and marketing coaching.',
      'Clarify which services are à la carte so authors can tailor support to their publishing goals and budget.',
      {
        type: 'list',
        items: [
          'Production suite: editing, layout, ISBN registration',
          'Distribution reach: global eBook platforms and boutique bookstores',
          'Launch toolkit: press release templates and social media calendars'
        ]
      }
    ]
  },
  bookstore: {
    title: 'Bookstore',
    body: [
      'Browse new releases, seasonal spotlights, and limited editions curated by our in-house team of editors and booksellers.',
      'Filter by genre or theme, discover staff recommendations, and add titles directly to your cart without leaving the experience.'
    ],
    store: {
      type: 'sellastic',
      containerId: 'my-store-125179016',
      scriptUrl:
        'https://app.sellastik.store/script.js?125179016&data_platform=code&data_date=2025-10-11',
      arguments: [
        'categoriesPerRow=3',
        'views=grid(20,3) list(60) table(60)',
        'categoryView=grid',
        'searchView=list',
        'id=my-store-125179016'
      ],
      loadingMessage: 'Ładujemy naszą księgarnię…',
      errorMessage:
        'Nie udało się załadować księgarni. Odśwież stronę lub spróbuj ponownie później.'
    }
  },
  contact: {
    title: 'Contact',
    body: [
      'Reach out to our team for manuscript submissions, partnership opportunities, or tailored recommendations for your next release.',
      'We aim to respond within two business days. For quick questions, explore our FAQ resources or connect via social channels.'
    ],
    contactDetails: {
      phoneLabel: 'Phone',
      phoneNumber: '+48 123 456 789',
      emailLabel: 'Email',
      emailAddress: 'kontakt@twojwydawnictwo.pl',
      formRecipient: 'kontakt@twojwydawnictwo.pl',
      formEndpoint: 'https://formsubmit.co/ajax/kontakt%40twojwydawnictwo.pl',
      subject: 'New inquiry from the Publishing Portfolio contact form',
      submittingMessage: 'Sending your message…',
      successMessage: 'Dziękujemy! Odpowiemy w ciągu dwóch dni roboczych.',
      errorMessage: 'Przepraszamy, nie udało się wysłać wiadomości. Spróbuj ponownie później.'
    }
  }
};
