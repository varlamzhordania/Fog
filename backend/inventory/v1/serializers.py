from rest_framework import serializers

from inventory.models import (
    Media, Category, Tag, ProductMedia, Product,
)


class MediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Media
        fields = ["id", "file", "media_type", "alt_text", "title"]
        read_only_fields = fields


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
            'is_filterable',
            'children',
        ]

    def get_img(self, obj):
        if hasattr(obj, 'img') and obj.img and hasattr(
                obj.img,
                'file'
        ) and obj.img.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.img.file.url)
            return obj.img.file.url
        return None

    def get_children(self, obj):
        children = obj.get_children().filter(is_active=True)
        return CategorySerializer(
            children,
            many=True,
            context=self.context
        ).data


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug', 'is_filterable']


class TagMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name", "slug"]
        read_only_fields = fields


class CategoryMinimalSerializer(serializers.ModelSerializer):
    breadcrumb = serializers.CharField(
        source="get_breadcrumb",
        read_only=True
    )

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "breadcrumb"]
        read_only_fields = fields


class ProductMediaSerializer(serializers.ModelSerializer):
    media = MediaSerializer(read_only=True)

    class Meta:
        model = ProductMedia
        fields = ["id", "media", "is_featured", "display_order"]
        read_only_fields = fields


class ProductSerializer(serializers.ModelSerializer):
    category = CategoryMinimalSerializer(read_only=True)
    tags = TagMinimalSerializer(many=True, read_only=True)
    primary_image = MediaSerializer(read_only=True)
    gallery = ProductMediaSerializer(
        source="product_media_items",
        many=True,
        read_only=True
    )

    # Extract calculated available stock (quantity - reserved_quantity)
    available_stock = serializers.IntegerField(
        source="product_stock.available_quantity",
        read_only=True,
        default=0
    )

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "sku",
            "product_type",
            "short_description",
            "description",
            "base_price",
            "is_featured",
            "category",
            "tags",
            "primary_image",
            "gallery",
            "available_stock",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields
