from rest_framework import serializers

from inventory.models import Media, Category


class MediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Media
        fields = '__all__'


class CategorySerializer(serializers.ModelSerializer):
    img = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            'id',
            'name',
            'slug',
            'description',
            'img',
            'is_featured',
            'children',
        ]

    def get_img(self, obj):
        if hasattr(obj, 'img') and obj.img and hasattr(obj.img, 'file') and obj.img.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.img.file.url)
            return obj.img.file.url
        return None

    def get_children(self, obj):
        children = obj.get_children().filter(is_active=True)
        return CategorySerializer(children, many=True, context=self.context).data