import { defineMessages } from 'react-intl';

const messages = defineMessages({
  title: {
    id: '3DObjectBlock.title',
    defaultMessage: '3D Object Block',
  },
  fileField: {
    id: '3DObjectBlock.fileField',
    defaultMessage: '3D File',
  },
  description: {
    id: '3DObjectBlock.description',
    defaultMessage: 'Upload an STL or 360 image file.',
  },
});

const ThreeDBlockSchema = (intl) => ({
  title: intl.formatMessage(messages.title),
  fieldsets: [
    {
      id: 'default',
      title: 'Default',
      fields: ['file'],
    },
  ],
  properties: {
    file: {
      title: intl.formatMessage(messages.fileField),
      description: intl.formatMessage(messages.description),
      widget: 'attachedfile',
    },
  },
  required: ['file'],
});

export default ThreeDBlockSchema;
